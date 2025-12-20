import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's Gmail connections
    const { data: connections, error: connError } = await supabase
      .from("gmail_connections")
      .select("*")
      .eq("user_id", user.id);

    if (connError || !connections?.length) {
      return new Response(JSON.stringify({ error: "No Gmail connections found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalProcessed = 0;
    let totalTransactions = 0;

    for (const connection of connections) {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/gmail-process-history`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              connectionId: connection.id,
              historyId: connection.history_id || "1",
            }),
          }
        );

        const result = await response.json();
        console.log(`Sync result for ${connection.email}:`, result);

        if (result.processed) totalProcessed += result.processed;
        if (result.transactionsCreated) totalTransactions += result.transactionsCreated;
      } catch (error) {
        console.error(`Sync error for ${connection.email}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        transactionsCreated: totalTransactions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
