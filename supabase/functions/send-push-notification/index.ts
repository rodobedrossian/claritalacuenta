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
function base64UrlEncode(input: Uint8Array | ArrayBuffer): string {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Base64URL decode
function base64UrlDecode(str: string): Uint8Array {
  // Add padding
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Create VAPID JWT token
async function createVapidJwt(
  audience: string,
  subject: string,
  publicKeyB64: string,
  privateKeyB64: string
): Promise<string> {
  // Decode keys
  const publicKeyBytes = base64UrlDecode(publicKeyB64);
  const privateKeyBytes = base64UrlDecode(privateKeyB64);
  
  console.log("Public key length:", publicKeyBytes.length);
  console.log("Private key length:", privateKeyBytes.length);
  
  // Public key should be 65 bytes (uncompressed point: 0x04 + 32 bytes X + 32 bytes Y)
  if (publicKeyBytes.length !== 65) {
    throw new Error(`Invalid public key length: ${publicKeyBytes.length}, expected 65`);
  }
  
  // Private key should be 32 bytes (raw scalar)
  if (privateKeyBytes.length !== 32) {
    throw new Error(`Invalid private key length: ${privateKeyBytes.length}, expected 32`);
  }
  
  // Extract X and Y coordinates (skip the 0x04 prefix)
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);
  
  // Create JWK for private key
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncode(x),
    y: base64UrlEncode(y),
    d: base64UrlEncode(privateKeyBytes),
  };
  
  console.log("JWK created:", { kty: jwk.kty, crv: jwk.crv, xLen: jwk.x.length, yLen: jwk.y.length, dLen: jwk.d.length });
  
  // Import private key
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  
  // JWT Header
  const header = { typ: "JWT", alg: "ES256" };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  
  // JWT Claims
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };
  const claimsB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  
  // Unsigned token
  const unsignedToken = `${headerB64}.${claimsB64}`;
  
  // Sign
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );
  
  const signatureB64 = base64UrlEncode(signature);
  
  console.log("JWT signed, signature length:", new Uint8Array(signature).length);
  
  return `${unsignedToken}.${signatureB64}`;
}

// Send Web Push notification
async function sendWebPush(
  subscription: { endpoint: string; p256dh_key: string; auth_key: string },
  _payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<Response> {
  const audience = new URL(subscription.endpoint).origin;
  
  // Create VAPID JWT
  const jwt = await createVapidJwt(audience, vapidSubject, vapidPublicKey, vapidPrivateKey);
  
  console.log("Sending to endpoint:", subscription.endpoint);
  console.log("Authorization header created");
  
  // Send empty push (without encrypted payload for now)
  // This tells the browser to wake up the service worker
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
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

    console.log("VAPID keys loaded, public key length:", vapidPublicKey.length);

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
        console.log("Processing subscription:", subscription.id, subscription.device_name);
        
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

        const responseText = await response.text();
        console.log("Push response:", response.status, responseText);
        
        if (response.ok || response.status === 201) {
          sentCount++;
          console.log("Push sent successfully to:", subscription.device_name || subscription.endpoint.slice(-20));
        } else if (response.status === 404 || response.status === 410) {
          console.log("Removing expired subscription:", subscription.id);
          await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
          errors.push(`${subscription.id}: subscription expired`);
        } else {
          console.error("Push failed:", response.status, responseText);
          errors.push(`${subscription.id}: ${response.status} - ${responseText}`);
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

    console.log(`Push notification result: ${sentCount}/${subscriptions.length}`, errors.length > 0 ? errors : "no errors");

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
