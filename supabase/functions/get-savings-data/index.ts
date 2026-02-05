import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface SavingsEntry {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  entry_type: string;
  savings_type: string;
  notes: string | null;
  created_at: string;
}

interface Investment {
  id: string;
  user_id: string;
  name: string;
  investment_type: string;
  currency: string;
  principal_amount: number;
  current_amount: number;
  interest_rate: number | null;
  rate_type: string | null;
  institution: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  currency: string;
  target_date: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
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

    console.log(`Fetching savings data for user: ${user.id}`);

    // Execute all queries in parallel
    const [
      savingsResult,
      exchangeRateResult,
      entriesResult,
      investmentsResult,
      goalsResult
    ] = await Promise.all([
      // Current savings (aggregated)
      supabase
        .from("savings")
        .select("id, usd_amount, ars_amount")
        .maybeSingle(),
      
      // Exchange rate
      supabase
        .from("exchange_rates")
        .select("rate, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      
      // Savings entries
      supabase
        .from("savings_entries")
        .select("*")
        .order("created_at", { ascending: false }),
      
      // Investments
      supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: false }),
      
      // Goals
      supabase
        .from("savings_goals")
        .select("*")
        .order("created_at", { ascending: false })
    ]);

    // Log any errors
    if (savingsResult.error) console.error("Savings error:", savingsResult.error);
    if (exchangeRateResult.error) console.error("Exchange rate error:", exchangeRateResult.error);
    if (entriesResult.error) console.error("Entries error:", entriesResult.error);
    if (investmentsResult.error) console.error("Investments error:", investmentsResult.error);
    if (goalsResult.error) console.error("Goals error:", goalsResult.error);

    // Parse entries
    const entries: SavingsEntry[] = (entriesResult.data || []).map((e: any) => ({
      ...e,
      amount: typeof e.amount === "string" ? parseFloat(e.amount) : e.amount,
      savings_type: e.savings_type || "cash"
    }));

    // Parse investments
    const investments: Investment[] = (investmentsResult.data || []).map((i: any) => ({
      ...i,
      principal_amount: typeof i.principal_amount === "string" ? parseFloat(i.principal_amount) : i.principal_amount,
      current_amount: typeof i.current_amount === "string" ? parseFloat(i.current_amount) : i.current_amount,
      interest_rate: i.interest_rate ? (typeof i.interest_rate === "string" ? parseFloat(i.interest_rate) : i.interest_rate) : null
    }));

    // Parse goals
    const goals: SavingsGoal[] = (goalsResult.data || []).map((g: any) => ({
      ...g,
      target_amount: typeof g.target_amount === "string" ? parseFloat(g.target_amount) : g.target_amount
    }));

    // Parse current savings
    let currentSavings = {
      usd: savingsResult.data?.usd_amount 
        ? (typeof savingsResult.data.usd_amount === "string" 
            ? parseFloat(savingsResult.data.usd_amount) 
            : savingsResult.data.usd_amount)
        : 0,
      ars: savingsResult.data?.ars_amount 
        ? (typeof savingsResult.data.ars_amount === "string" 
            ? parseFloat(savingsResult.data.ars_amount) 
            : savingsResult.data.ars_amount)
        : 0,
      recordId: savingsResult.data?.id || null
    };

    // If no savings record exists but entries do, rebuild from entries
    let needsRebuild = false;
    if (!savingsResult.data && entries.length > 0) {
      needsRebuild = true;
      const rebuilt = entries.reduce(
        (acc, e) => {
          const delta = e.entry_type === "withdrawal" ? -e.amount : e.amount;
          if (e.currency === "USD") acc.usd += delta;
          else acc.ars += delta;
          return acc;
        },
        { usd: 0, ars: 0 }
      );

      currentSavings.usd = Math.max(0, rebuilt.usd);
      currentSavings.ars = Math.max(0, rebuilt.ars);
    }

    // Parse exchange rate
    const exchangeRate = exchangeRateResult.data?.rate
      ? (typeof exchangeRateResult.data.rate === "string" 
          ? parseFloat(exchangeRateResult.data.rate) 
          : exchangeRateResult.data.rate)
      : 1300;

    // Calculate totals server-side
    const totalInvestedUSD = investments
      .filter(i => i.is_active && i.currency === "USD")
      .reduce((sum, i) => sum + i.current_amount, 0);

    const totalInvestedARS = investments
      .filter(i => i.is_active && i.currency === "ARS")
      .reduce((sum, i) => sum + i.current_amount, 0);

    const totalPatrimonioARS = 
      (currentSavings.usd * exchangeRate) + currentSavings.ars +
      (totalInvestedUSD * exchangeRate) + totalInvestedARS;

    const activeGoalsCount = goals.filter(g => !g.is_completed).length;
    const completedGoalsCount = goals.filter(g => g.is_completed).length;

    const response = {
      currentSavings,
      exchangeRate,
      entries,
      investments,
      goals,
      totals: {
        investedUSD: totalInvestedUSD,
        investedARS: totalInvestedARS,
        patrimonioARS: totalPatrimonioARS,
        activeGoals: activeGoalsCount,
        completedGoals: completedGoalsCount
      },
      needsRebuild
    };

    console.log(`Savings data fetched successfully. Entries: ${entries.length}, Investments: ${investments.length}, Goals: ${goals.length}`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in get-savings-data:", error);
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
