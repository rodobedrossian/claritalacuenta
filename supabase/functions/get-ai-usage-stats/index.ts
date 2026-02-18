import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Approximate pricing per 1M tokens (USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "google/gemini-3-flash-preview": { input: 0.15, output: 0.60 },
  "google/gemini-2.5-flash": { input: 0.15, output: 0.60 },
  "google/gemini-2.5-flash-lite": { input: 0.075, output: 0.30 },
};

const DEFAULT_PRICING = { input: 0.15, output: 0.60 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify admin
    const authHeader = req.headers.get("Authorization") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: authUser } = await adminClient.auth.admin.getUserById(user.id);
    if (authUser?.user?.app_metadata?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse date filters
    const url = new URL(req.url);
    const startDate = url.searchParams.get("start_date") || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const endDate = url.searchParams.get("end_date") || new Date().toISOString().split("T")[0];

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all logs in date range
    const { data: logs, error: logsError } = await supabase
      .from("ai_usage_logs")
      .select("*")
      .gte("created_at", `${startDate}T00:00:00Z`)
      .lte("created_at", `${endDate}T23:59:59Z`)
      .order("created_at", { ascending: false })
      .limit(10000);

    if (logsError) {
      throw new Error(`Failed to fetch logs: ${logsError.message}`);
    }

    // Aggregate by function
    const byFunction: Record<string, {
      calls: number;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      model: string;
      estimated_cost_usd: number;
    }> = {};

    // Aggregate by user
    const byUser: Record<string, {
      user_id: string;
      calls: number;
      total_tokens: number;
      estimated_cost_usd: number;
    }> = {};

    // Aggregate by day
    const byDay: Record<string, {
      date: string;
      calls: number;
      total_tokens: number;
      estimated_cost_usd: number;
    }> = {};

    let totalCost = 0;

    for (const log of logs || []) {
      const pricing = MODEL_PRICING[log.model] || DEFAULT_PRICING;
      const cost = (log.prompt_tokens * pricing.input + log.completion_tokens * pricing.output) / 1_000_000;
      totalCost += cost;

      // By function
      if (!byFunction[log.function_name]) {
        byFunction[log.function_name] = { calls: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, model: log.model, estimated_cost_usd: 0 };
      }
      const fn = byFunction[log.function_name];
      fn.calls++;
      fn.prompt_tokens += log.prompt_tokens || 0;
      fn.completion_tokens += log.completion_tokens || 0;
      fn.total_tokens += log.total_tokens || 0;
      fn.estimated_cost_usd += cost;

      // By user
      if (!byUser[log.user_id]) {
        byUser[log.user_id] = { user_id: log.user_id, calls: 0, total_tokens: 0, estimated_cost_usd: 0 };
      }
      const usr = byUser[log.user_id];
      usr.calls++;
      usr.total_tokens += log.total_tokens || 0;
      usr.estimated_cost_usd += cost;

      // By day
      const day = log.created_at.split("T")[0];
      if (!byDay[day]) {
        byDay[day] = { date: day, calls: 0, total_tokens: 0, estimated_cost_usd: 0 };
      }
      const d = byDay[day];
      d.calls++;
      d.total_tokens += log.total_tokens || 0;
      d.estimated_cost_usd += cost;
    }

    // Get user emails for the user breakdown
    const userIds = Object.keys(byUser);
    let userEmails: Record<string, string> = {};
    if (userIds.length > 0) {
      for (const uid of userIds) {
        const { data: u } = await adminClient.auth.admin.getUserById(uid);
        if (u?.user?.email) {
          userEmails[uid] = u.user.email;
        }
      }
    }

    const userBreakdown = Object.values(byUser)
      .map((u) => ({ ...u, email: userEmails[u.user_id] || u.user_id }))
      .sort((a, b) => b.total_tokens - a.total_tokens);

    return new Response(
      JSON.stringify({
        summary: {
          total_calls: (logs || []).length,
          total_prompt_tokens: (logs || []).reduce((acc, l) => acc + (l.prompt_tokens || 0), 0),
          total_completion_tokens: (logs || []).reduce((acc, l) => acc + (l.completion_tokens || 0), 0),
          total_tokens: (logs || []).reduce((acc, l) => acc + (l.total_tokens || 0), 0),
          estimated_cost_usd: Math.round(totalCost * 10000) / 10000,
        },
        by_function: Object.entries(byFunction).map(([name, data]) => ({
          function_name: name,
          ...data,
          estimated_cost_usd: Math.round(data.estimated_cost_usd * 10000) / 10000,
        })),
        by_user: userBreakdown.map((u) => ({
          ...u,
          estimated_cost_usd: Math.round(u.estimated_cost_usd * 10000) / 10000,
        })),
        by_day: Object.values(byDay)
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((d) => ({
            ...d,
            estimated_cost_usd: Math.round(d.estimated_cost_usd * 10000) / 10000,
          })),
        filters: { start_date: startDate, end_date: endDate },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[get-ai-usage-stats] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
