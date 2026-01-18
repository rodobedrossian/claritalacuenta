import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransactionsRequest {
  page: number;
  limit: number;
  filters: {
    type?: string;
    category?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  };
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
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const { page = 0, limit = 20, filters = {} } = await req.json() as TransactionsRequest;
    
    console.log(`Fetching transactions for user: ${user.id}, page: ${page}, limit: ${limit}, filters:`, filters);

    // Calculate pagination offset
    const from = page * limit;
    const to = from + limit - 1;

    // Build base query for transactions
    // Credit card consumptions are now in credit_card_transactions table
    // This table only contains real cashflow transactions
    let transactionsQuery = supabase
      .from("transactions")
      .select("id, type, amount, currency, category, description, date, user_id, from_savings, savings_source", { count: "exact" })
      .eq("status", "confirmed")
      .order("date", { ascending: false });

    // Apply filters
    if (filters.type && filters.type !== "all") {
      transactionsQuery = transactionsQuery.eq("type", filters.type);
    }
    if (filters.category && filters.category !== "all") {
      transactionsQuery = transactionsQuery.eq("category", filters.category);
    }
    if (filters.userId && filters.userId !== "all") {
      transactionsQuery = transactionsQuery.eq("user_id", filters.userId);
    }
    if (filters.startDate) {
      transactionsQuery = transactionsQuery.gte("date", filters.startDate);
    }
    if (filters.endDate) {
      transactionsQuery = transactionsQuery.lte("date", filters.endDate);
    }

    // Apply pagination
    transactionsQuery = transactionsQuery.range(from, to);

    // Execute transaction query
    const transactionsResult = await transactionsQuery;

    // Always fetch categories for name lookup, users only on first page
    const [categoriesResult, usersResult] = await Promise.all([
      supabase.from("categories").select("id, name, type").order("name"),
      page === 0 
        ? supabase.from("profiles").select("id, full_name").order("full_name")
        : Promise.resolve({ data: null, error: null })
    ]);

    // Log errors
    if (transactionsResult.error) {
      console.error("Transactions error:", transactionsResult.error);
    }
    if (categoriesResult?.error) {
      console.error("Categories error:", categoriesResult.error);
    }
    if (usersResult?.error) {
      console.error("Users error:", usersResult.error);
    }

    // Build category ID to name map
    const categoryMap = new Map<string, string>();
    for (const c of (categoriesResult.data || [])) {
      categoryMap.set(c.id, c.name);
    }

    // Parse transactions and enrich with category name
    const transactions: Transaction[] = (transactionsResult.data || []).map((t: any) => ({
      ...t,
      amount: typeof t.amount === "string" ? parseFloat(t.amount) : t.amount,
      from_savings: t.from_savings || false,
      categoryName: categoryMap.get(t.category) || t.category
    }));

    const totalCount = transactionsResult.count || 0;
    const hasMore = transactions.length === limit;

    const response: any = {
      transactions,
      totalCount,
      hasMore,
      page
    };

    // Include categories (with id and name) and users only on first page
    if (page === 0) {
      response.categories = (categoriesResult?.data || []).map((c: any) => ({ id: c.id, name: c.name, type: c.type }));
      response.users = usersResult?.data || [];
    }

    console.log(`Transactions fetched: ${transactions.length} of ${totalCount}, hasMore: ${hasMore}`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in get-transactions-data:", error);
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
