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
  categoryName?: string;
  categoryIcon?: string | null;
  categoryColor?: string | null;
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

    // Fetch categories for name, icon, and color lookup
    const categoriesResult = await supabase.from("categories").select("id, name, type, icon, color").order("name");

    // Log errors
    if (transactionsResult.error) {
      console.error("Transactions error:", transactionsResult.error);
    }
    if (categoriesResult?.error) {
      console.error("Categories error:", categoriesResult.error);
    }

    // Build category ID to data map
    const categoryMap = new Map<string, { name: string; icon: string | null; color: string | null }>();
    for (const c of (categoriesResult.data || [])) {
      categoryMap.set(c.id, { name: c.name, icon: c.icon, color: c.color });
    }

    // Parse transactions and enrich with category data
    const transactions: Transaction[] = (transactionsResult.data || []).map((t: any) => {
      const categoryData = categoryMap.get(t.category);
      return {
        ...t,
        amount: typeof t.amount === "string" ? parseFloat(t.amount) : t.amount,
        from_savings: t.from_savings || false,
        categoryName: categoryData?.name || t.category,
        categoryIcon: categoryData?.icon || null,
        categoryColor: categoryData?.color || null,
      };
    });

    const totalCount = transactionsResult.count || 0;
    const hasMore = transactions.length === limit;

    const response: any = {
      transactions,
      totalCount,
      hasMore,
      page
    };

    // Include categories on first page
    if (page === 0) {
      response.categories = (categoriesResult?.data || []).map((c: any) => ({ 
        id: c.id, 
        name: c.name, 
        type: c.type,
        icon: c.icon,
        color: c.color
      }));
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
