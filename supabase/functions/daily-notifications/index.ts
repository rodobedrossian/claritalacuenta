import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time in Argentina timezone
    const now = new Date();
    const argentinaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
    const currentHour = argentinaTime.getHours();
    const currentMinute = argentinaTime.getMinutes();
    
    console.log(`Daily notifications check at ${currentHour}:${currentMinute} Argentina time`);

    // Get all users with notification settings
    const { data: settings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*");

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw settingsError;
    }

    if (!settings || settings.length === 0) {
      console.log("No notification settings found");
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No settings configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let morningCount = 0;
    let eveningCount = 0;

    for (const setting of settings) {
      // Parse user's preferred times
      const morningHour = parseInt(setting.morning_time?.split(":")[0] || "9");
      const eveningHour = parseInt(setting.evening_time?.split(":")[0] || "21");

      // Check if it's time for morning budget check
      if (setting.morning_budget_check && currentHour === morningHour && currentMinute < 30) {
        // Check if we already sent this notification today
        const todayStart = new Date(argentinaTime);
        todayStart.setHours(0, 0, 0, 0);

        const { data: existingNotif } = await supabase
          .from("notification_history")
          .select("id")
          .eq("user_id", setting.user_id)
          .eq("type", "morning_budget_check")
          .gte("sent_at", todayStart.toISOString())
          .maybeSingle();

        if (!existingNotif) {
          // Get budget status for this user
          const currentMonth = `${argentinaTime.getFullYear()}-${String(argentinaTime.getMonth() + 1).padStart(2, "0")}`;
          
          const { data: budgets } = await supabase
            .from("budgets")
            .select("category, monthly_limit, currency")
            .eq("user_id", setting.user_id)
            .eq("is_active", true);

          const { data: transactions } = await supabase
            .from("transactions")
            .select("amount, category, currency")
            .eq("user_id", setting.user_id)
            .eq("type", "expense")
            .gte("date", `${currentMonth}-01`)
            .lt("date", `${currentMonth}-32`);

          let budgetSummary = "Tus presupuestos están en orden";
          let hasWarning = false;

          if (budgets && transactions) {
            for (const budget of budgets) {
              const spent = transactions
                .filter(t => t.category === budget.category && t.currency === budget.currency)
                .reduce((sum, t) => sum + Number(t.amount), 0);
              
              const percentage = (spent / Number(budget.monthly_limit)) * 100;
              
              if (percentage >= 80) {
                hasWarning = true;
                budgetSummary = `${budget.category}: ${percentage.toFixed(0)}% usado`;
                break;
              }
            }
          }

          // Send morning notification
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: setting.user_id,
              title: hasWarning ? "⚠️ Atención con tu presupuesto" : "☀️ Buenos días!",
              body: budgetSummary,
              type: "morning_budget_check",
              url: "/",
            },
          });
          
          morningCount++;
          console.log(`Sent morning notification to user ${setting.user_id}`);
        }
      }

      // Check if it's time for evening expense reminder
      if (setting.evening_expense_reminder && currentHour === eveningHour && currentMinute < 30) {
        const todayStart = new Date(argentinaTime);
        todayStart.setHours(0, 0, 0, 0);

        const { data: existingNotif } = await supabase
          .from("notification_history")
          .select("id")
          .eq("user_id", setting.user_id)
          .eq("type", "evening_expense_reminder")
          .gte("sent_at", todayStart.toISOString())
          .maybeSingle();

        if (!existingNotif) {
          // Count today's transactions
          const { count } = await supabase
            .from("transactions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", setting.user_id)
            .gte("date", todayStart.toISOString());

          const message = count === 0 
            ? "No registraste ningún gasto hoy. ¿Nada que reportar?"
            : `Registraste ${count} transacción${count === 1 ? "" : "es"} hoy`;

          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: setting.user_id,
              title: "🌙 Recordatorio de gastos",
              body: message,
              type: "evening_expense_reminder",
              url: "/",
            },
          });
          
          eveningCount++;
          console.log(`Sent evening notification to user ${setting.user_id}`);
        }
      }
    }

    console.log(`Daily notifications: ${morningCount} morning, ${eveningCount} evening`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        morning: morningCount, 
        evening: eveningCount 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in daily-notifications:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
