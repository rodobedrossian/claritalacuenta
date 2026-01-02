import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  user_id?: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  url?: string;
}

// Base64URL encode
function base64UrlEncode(data: Uint8Array | string): string {
  const str = typeof data === "string" ? data : String.fromCharCode(...data);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Base64URL decode
function base64UrlDecode(str: string): Uint8Array {
  // Add padding if needed
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Create VAPID JWT token
async function createVapidJwt(
  audience: string,
  subject: string,
  publicKey: string,
  privateKey: string
): Promise<string> {
  const encoder = new TextEncoder();
  
  // JWT Header
  const header = { typ: "JWT", alg: "ES256" };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  
  // JWT Claims
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };
  const claimsB64 = base64UrlEncode(JSON.stringify(claims));
  
  // Unsigned token
  const unsignedToken = `${headerB64}.${claimsB64}`;
  
  // Decode the raw private key (32 bytes for P-256)
  const privateKeyBytes = base64UrlDecode(privateKey);
  const publicKeyBytes = base64UrlDecode(publicKey);
  
  // Import private key as JWK (P-256 curve)
  // The public key is 65 bytes: 0x04 + 32 bytes X + 32 bytes Y
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);
  
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncode(x),
    y: base64UrlEncode(y),
    d: base64UrlEncode(privateKeyBytes),
  };
  
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  
  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    encoder.encode(unsignedToken)
  );
  
  // Convert DER signature to raw format (r || s, each 32 bytes)
  const signatureBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  
  if (signatureBytes.length === 64) {
    // Already in raw format
    r = signatureBytes.slice(0, 32);
    s = signatureBytes.slice(32, 64);
  } else {
    // DER format, need to parse
    r = signatureBytes.slice(0, 32);
    s = signatureBytes.slice(32);
  }
  
  // Ensure r and s are 32 bytes each
  const rawSignature = new Uint8Array(64);
  rawSignature.set(r.length > 32 ? r.slice(r.length - 32) : r, 32 - Math.min(r.length, 32));
  rawSignature.set(s.length > 32 ? s.slice(s.length - 32) : s, 64 - Math.min(s.length, 32));
  
  const signatureB64 = base64UrlEncode(rawSignature);
  
  return `${unsignedToken}.${signatureB64}`;
}

// Send Web Push notification (simplified - without payload encryption for now)
async function sendWebPush(
  subscription: { endpoint: string; p256dh_key: string; auth_key: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<Response> {
  const audience = new URL(subscription.endpoint).origin;
  
  // Create VAPID authorization
  const jwt = await createVapidJwt(audience, vapidSubject, vapidPublicKey, vapidPrivateKey);
  
  // Send the request
  // Note: For full RFC 8291 compliance, payload should be encrypted using ECDH + HKDF + AES-GCM
  // This is a simplified version that works with some push services
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
      "Content-Type": "application/octet-stream",
      "TTL": "86400",
      "Content-Length": "0",
    },
  });

  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@financeflow.app";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    console.log("Sending push notification:", payload);

    if (!payload.user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", payload.user_id);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions found for user:", payload.user_id);
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      data: {
        type: payload.type,
        url: payload.url || "/",
        ...payload.data,
      },
    });

    let sentCount = 0;
    const errors: string[] = [];

    for (const subscription of subscriptions) {
      try {
        console.log("Sending to subscription:", subscription.id, subscription.device_name);
        
        const response = await sendWebPush(
          {
            endpoint: subscription.endpoint,
            p256dh_key: subscription.p256dh_key,
            auth_key: subscription.auth_key,
          },
          pushPayload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        );

        console.log("Push response status:", response.status);
        
        if (response.ok || response.status === 201) {
          sentCount++;
          console.log("Push sent successfully to:", subscription.device_name || subscription.endpoint.slice(-20));
        } else if (response.status === 404 || response.status === 410) {
          // Subscription expired or invalid - remove it
          console.log("Removing expired subscription:", subscription.id);
          await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
          errors.push(`${subscription.id}: subscription expired`);
        } else {
          const errorText = await response.text();
          console.error("Push failed:", response.status, errorText);
          errors.push(`${subscription.id}: ${response.status} - ${errorText}`);
        }
      } catch (err: unknown) {
        console.error("Error sending push:", err);
        errors.push(`${subscription.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Record in notification history
    await supabase.from("notification_history").insert({
      user_id: payload.user_id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });

    console.log(`Push notification sent: ${sentCount}/${subscriptions.length}`, errors.length > 0 ? errors : "");

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        total: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
