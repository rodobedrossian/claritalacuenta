import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Optional: check specific user from request
    let specificUserId: string | null = null;
    try {
      const body = await req.json();
      specificUserId = body.user_id || null;
    } catch {
      // No body, check all users
    }

    const now = new Date();
    const argentinaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
    const currentMonth = `${argentinaTime.getFullYear()}-${String(argentinaTime.getMonth() + 1).padStart(2, "0")}`;
    
    console.log(`Checking budget alerts for month: ${currentMonth}`);

    // Get all users with budget_exceeded_alert enabled
    let settingsQuery = supabase
      .from("notification_settings")
      .select("user_id")
      .eq("budget_exceeded_alert", true);
    
    if (specificUserId) {
      settingsQuery = settingsQuery.eq("user_id", specificUserId);
    }

    const { data: settings, error: settingsError } = await settingsQuery;

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw settingsError;
    }

    if (!settings || settings.length === 0) {
      console.log("No users with budget alerts enabled");
      return new Response(
        JSON.stringify({ success: true, alerts: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let alertCount = 0;

    for (const setting of settings) {
      // Get user's active budgets
      const { data: budgets } = await supabase
        .from("budgets")
        .select("id, category, monthly_limit, currency")
        .eq("user_id", setting.user_id)
        .eq("is_active", true);

      if (!budgets || budgets.length === 0) continue;

      // Get user's expenses for current month
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, category, currency")
        .eq("user_id", setting.user_id)
        .eq("type", "expense")
        .eq("status", "confirmed")
        .gte("date", `${currentMonth}-01`)
        .lt("date", `${currentMonth}-32`);

      if (!transactions) continue;

      // Check each budget
      for (const budget of budgets) {
        const spent = transactions
          .filter(t => t.category === budget.category && t.currency === budget.currency)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const percentage = (spent / Number(budget.monthly_limit)) * 100;

        if (percentage >= 100) {
          // Check if we already sent an alert for this budget today
          const todayStart = new Date(argentinaTime);
          todayStart.setHours(0, 0, 0, 0);

          const { data: existingAlert } = await supabase
            .from("notification_history")
            .select("id")
            .eq("user_id", setting.user_id)
            .eq("type", "budget_exceeded")
            .gte("sent_at", todayStart.toISOString())
            .contains("data", { category: budget.category })
            .maybeSingle();

          if (!existingAlert) {
            const currency = budget.currency === "USD" ? "US$" : "$";
            
            await supabase.functions.invoke("send-push-notification", {
              body: {
                user_id: setting.user_id,
                title: "🚨 Presupuesto excedido",
                body: `${budget.category}: ${currency}${spent.toLocaleString()} de ${currency}${Number(budget.monthly_limit).toLocaleString()} (${percentage.toFixed(0)}%)`,
                type: "budget_exceeded",
                data: { category: budget.category, budget_id: budget.id },
                url: "/",
              },
            });

            alertCount++;
            console.log(`Sent budget alert for user ${setting.user_id}, category ${budget.category}`);
          }
        }
      }
    }

    console.log(`Budget alerts sent: ${alertCount}`);

    return new Response(
      JSON.stringify({ success: true, alerts: alertCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in check-budget-alerts:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
