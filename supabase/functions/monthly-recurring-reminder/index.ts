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

    const now = new Date();
    const argentinaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
    const currentDay = argentinaTime.getDate();
    const currentHour = argentinaTime.getHours();
    
    console.log(`Monthly recurring check on day ${currentDay} at ${currentHour}:00`);

    // Get users whose monthly_reminder_day matches today
    const { data: settings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("user_id, monthly_reminder_day")
      .eq("monthly_recurring_reminder", true)
      .eq("monthly_reminder_day", currentDay);

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw settingsError;
    }

    if (!settings || settings.length === 0) {
      console.log(`No users configured for day ${currentDay}`);
      return new Response(
        JSON.stringify({ success: true, sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only send at 9am
    if (currentHour !== 9) {
      console.log("Not 9am, skipping");
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "Not the right hour" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;

    for (const setting of settings) {
      // Check if we already sent this month
      const monthStart = new Date(argentinaTime.getFullYear(), argentinaTime.getMonth(), 1);
      
      const { data: existingNotif } = await supabase
        .from("notification_history")
        .select("id")
        .eq("user_id", setting.user_id)
        .eq("type", "monthly_recurring_reminder")
        .gte("sent_at", monthStart.toISOString())
        .maybeSingle();

      if (existingNotif) {
        console.log(`Already sent monthly reminder to ${setting.user_id} this month`);
        continue;
      }

      // Get user's active recurring expenses
      const { data: recurring, error: recurringError } = await supabase
        .from("recurring_expenses")
        .select("id, description, default_amount, currency")
        .eq("user_id", setting.user_id)
        .eq("is_active", true);

      if (recurringError || !recurring || recurring.length === 0) {
        continue;
      }

      const totalARS = recurring
        .filter(r => r.currency === "ARS")
        .reduce((sum, r) => sum + Number(r.default_amount), 0);
      
      const totalUSD = recurring
        .filter(r => r.currency === "USD")
        .reduce((sum, r) => sum + Number(r.default_amount), 0);

      let body = `Tienes ${recurring.length} gasto${recurring.length === 1 ? "" : "s"} recurrente${recurring.length === 1 ? "" : "s"} para cargar`;
      
      if (totalARS > 0 || totalUSD > 0) {
        const parts = [];
        if (totalARS > 0) parts.push(`$${totalARS.toLocaleString()}`);
        if (totalUSD > 0) parts.push(`US$${totalUSD.toLocaleString()}`);
        body += ` (${parts.join(" + ")})`;
      }

      await supabase.functions.invoke("send-push-notification", {
        body: {
          user_id: setting.user_id,
          title: "📅 Gastos recurrentes del mes",
          body,
          type: "monthly_recurring_reminder",
          url: "/settings",
        },
      });

      sentCount++;
      console.log(`Sent monthly recurring reminder to ${setting.user_id}`);
    }

    console.log(`Monthly recurring reminders sent: ${sentCount}`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in monthly-recurring-reminder:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
