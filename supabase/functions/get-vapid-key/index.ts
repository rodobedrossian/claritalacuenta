import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKeyRaw = Deno.env.get("VAPID_PUBLIC_KEY");

    if (!vapidPublicKeyRaw) {
      console.error("VAPID_PUBLIC_KEY not configured");
      return new Response(
        JSON.stringify({ error: "VAPID key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Critical: Trim any whitespace from the key
    const vapidPublicKey = vapidPublicKeyRaw.trim();
    
    // Log for debugging - show first 20 chars to verify key format
    console.log("VAPID public key requested. Length:", vapidPublicKey.length, "First 20 chars:", vapidPublicKey.substring(0, 20));
    
    if (vapidPublicKeyRaw !== vapidPublicKey) {
      console.warn("WARNING: VAPID_PUBLIC_KEY had whitespace that was trimmed!");
    }

    return new Response(
      JSON.stringify({ vapidPublicKey }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in get-vapid-key:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
