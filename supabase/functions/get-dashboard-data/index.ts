import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DashboardRequest {
  month: string; // "2026-01" formato YYYY-MM
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  user_id: string;
  from_savings: boolean;
  savings_source: string | null;
  payment_method: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { month } = await req.json() as DashboardRequest;
    console.log(`Fetching dashboard data for month: ${month}, user: ${user.id}`);

    // Parse month to get start and end dates
    const [year, monthNum] = month.split("-").map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Execute all queries in parallel
    const [
      transactionsResult,
      savingsResult,
      exchangeRateResult,
      categoriesResult,
      usersResult,
      savingsEntriesResult,
      creditCardsResult,
      investmentsResult
    ] = await Promise.all([
      // Transactions for the month
      supabase
        .from("transactions")
        .select("id, type, amount, currency, category, description, date, user_id, from_savings, savings_source, payment_method")
        .gte("date", monthStart.toISOString())
        .lte("date", monthEnd.toISOString())
        .order("date", { ascending: false }),
      
      // Current savings
      supabase
        .from("savings")
        .select("usd_amount, ars_amount")
        .limit(1)
        .maybeSingle(),
      
      // Exchange rate
      supabase
        .from("exchange_rates")
        .select("rate, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      
      // Categories
      supabase
        .from("categories")
        .select("id, name, type")
        .order("name"),
      
      // Users/profiles
      supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name"),
      
      // Savings entries for the month (to calculate transfers from balance)
      supabase
        .from("savings_entries")
        .select("amount, currency, notes, entry_type")
        .eq("entry_type", "deposit")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString()),
      
      // Credit cards
      supabase
        .from("credit_cards")
        .select("id, name, bank, closing_day")
        .order("name"),
      
      // Investments
      supabase
        .from("investments")
        .select("current_amount, currency, is_active")
        .eq("is_active", true)
    ]);

    // Log any errors
    if (transactionsResult.error) console.error("Transactions error:", transactionsResult.error);
    if (savingsResult.error) console.error("Savings error:", savingsResult.error);
    if (exchangeRateResult.error) console.error("Exchange rate error:", exchangeRateResult.error);
    if (categoriesResult.error) console.error("Categories error:", categoriesResult.error);
    if (usersResult.error) console.error("Users error:", usersResult.error);
    if (savingsEntriesResult.error) console.error("Savings entries error:", savingsEntriesResult.error);
    if (creditCardsResult.error) console.error("Credit cards error:", creditCardsResult.error);
    if (investmentsResult.error) console.error("Investments error:", investmentsResult.error);

    const transactions: Transaction[] = (transactionsResult.data || []).map((t: any) => ({
      ...t,
      amount: typeof t.amount === "string" ? parseFloat(t.amount) : t.amount,
      from_savings: t.from_savings || false,
      payment_method: t.payment_method || "cash"
    }));

    // Calculate invested totals
    const investments = investmentsResult.data || [];
    let investedUSD = 0;
    let investedARS = 0;
    for (const i of investments) {
      const amount = typeof i.current_amount === "string" ? parseFloat(i.current_amount) : i.current_amount;
      if (i.currency === "USD") investedUSD += amount;
      else investedARS += amount;
    }

    // Calculate totals server-side
    // All transactions in this table are now real cashflow (credit card consumptions are in credit_card_transactions)
    let totals = {
      incomeUSD: 0,
      incomeARS: 0,
      expensesUSD: 0,
      expensesARS: 0,
      savingsTransfersUSD: 0,
      savingsTransfersARS: 0
    };

    for (const t of transactions) {
      if (t.type === "income") {
        if (t.currency === "USD") totals.incomeUSD += t.amount;
        else totals.incomeARS += t.amount;
      } else if (t.type === "expense" && !t.from_savings) {
        if (t.currency === "USD") totals.expensesUSD += t.amount;
        else totals.expensesARS += t.amount;
      }
    }

    // Calculate savings transfers from balance
    const savingsEntries = savingsEntriesResult.data || [];
    const balanceTransfers = savingsEntries.filter((e: any) => 
      e.notes?.includes("Transferencia desde balance")
    );
    
    for (const e of balanceTransfers) {
      const amount = typeof e.amount === "string" ? parseFloat(e.amount) : e.amount;
      if (e.currency === "USD") totals.savingsTransfersUSD += amount;
      else totals.savingsTransfersARS += amount;
    }

    // Build category ID to name map for lookups
    const categoryMap = new Map<string, string>();
    for (const c of (categoriesResult.data || [])) {
      categoryMap.set(c.id, c.name);
    }

    // Enrich transactions with category name
    const enrichedTransactions = transactions.map(t => ({
      ...t,
      categoryName: categoryMap.get(t.category) || t.category
    }));

    // Calculate spending by category
    const spendingMap = new Map<string, number>();
    for (const t of enrichedTransactions) {
      if (t.type === "expense") {
        const categoryName = categoryMap.get(t.category) || t.category;
        const key = `${categoryName} (${t.currency})`;
        spendingMap.set(key, (spendingMap.get(key) || 0) + t.amount);
      }
    }
    const spendingByCategory = Array.from(spendingMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Format current savings
    const currentSavings = {
      usd: savingsResult.data 
        ? (typeof savingsResult.data.usd_amount === "string" 
            ? parseFloat(savingsResult.data.usd_amount) 
            : savingsResult.data.usd_amount) 
        : 0,
      ars: savingsResult.data 
        ? (typeof savingsResult.data.ars_amount === "string" 
            ? parseFloat(savingsResult.data.ars_amount) 
            : savingsResult.data.ars_amount) 
        : 0
    };

    // Format exchange rate
    const exchangeRate = {
      rate: exchangeRateResult.data?.rate 
        ? (typeof exchangeRateResult.data.rate === "string" 
            ? parseFloat(exchangeRateResult.data.rate) 
            : exchangeRateResult.data.rate)
        : 1300,
      updatedAt: exchangeRateResult.data?.updated_at || null
    };

    const response = {
      totals,
      currentSavings,
      totalInvested: {
        usd: investedUSD,
        ars: investedARS
      },
      exchangeRate,
      transactions: enrichedTransactions,
      spendingByCategory,
      categories: (categoriesResult.data || []).map((c: any) => ({ id: c.id, name: c.name, type: c.type })),
      users: usersResult.data || [],
      creditCards: creditCardsResult.data || []
    };

    console.log(`Dashboard data fetched successfully. Total transactions: ${transactions.length}`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in get-dashboard-data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
