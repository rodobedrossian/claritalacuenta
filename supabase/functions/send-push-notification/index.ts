import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@0.5.0";

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

function base64UrlEncode(input: Uint8Array | ArrayBuffer): string {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function normalizeVapidSubject(subjectRaw: string): string {
  const s = subjectRaw.trim();
  if (!s) return "mailto:admin@financeflow.app";
  if (s.startsWith("mailto:") || s.startsWith("https://") || s.startsWith("http://")) return s;
  // If they set just an email, APNs tends to be strict; prefer mailto:
  if (s.includes("@")) return `mailto:${s}`;
  return s;
}

function exportedVapidKeysFromBase64Url(publicKeyB64: string, privateKeyB64: string): webpush.ExportedVapidKeys {
  // Trim whitespace from keys
  const publicKeyB64Clean = publicKeyB64.trim();
  const privateKeyB64Clean = privateKeyB64.trim();

  if (!publicKeyB64Clean || !privateKeyB64Clean) {
    throw new Error("VAPID keys cannot be empty");
  }

  const publicKeyBytes = base64UrlDecode(publicKeyB64Clean);
  const privateKeyBytes = base64UrlDecode(privateKeyB64Clean);

  // Validate public key: should be 65 bytes (0x04 prefix + 32 bytes x + 32 bytes y)
  if (publicKeyBytes.length !== 65) {
    throw new Error(
      `Invalid VAPID public key length: ${publicKeyBytes.length} (expected 65). ` +
        `Key might be incorrectly formatted. Make sure you're using the raw base64url encoded key from 'web-push generate-vapid-keys'`,
    );
  }

  // Validate private key: should be 32 bytes
  if (privateKeyBytes.length !== 32) {
    throw new Error(
      `Invalid VAPID private key length: ${privateKeyBytes.length} (expected 32). ` +
        `Key might be incorrectly formatted. Make sure you're using the raw base64url encoded key from 'web-push generate-vapid-keys'`,
    );
  }

  // Validate public key starts with 0x04 (uncompressed point indicator)
  if (publicKeyBytes[0] !== 0x04) {
    throw new Error(
      `Invalid VAPID public key format: first byte should be 0x04 (uncompressed), got 0x${publicKeyBytes[0].toString(16)}`,
    );
  }

  // Extract x and y coordinates (skip the 0x04 prefix)
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);

  // Create JWK format (base64url encode the coordinates)
  const publicJwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncode(x),
    y: base64UrlEncode(y),
  };

  const privateJwk: JsonWebKey = {
    ...publicJwk,
    d: base64UrlEncode(privateKeyBytes),
  };

  return {
    publicKey: publicJwk,
    privateKey: privateJwk,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables are required");
    }

    const vapidSubject = normalizeVapidSubject(Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@financeflow.app");

    // Validate subject format
    if (
      !vapidSubject.startsWith("mailto:") &&
      !vapidSubject.startsWith("https://") &&
      !vapidSubject.startsWith("http://")
    ) {
      console.warn(`VAPID_SUBJECT should start with 'mailto:', 'https://', or 'http://'. Got: ${vapidSubject}`);
    }

    console.log("VAPID Configuration:", {
      subject: vapidSubject,
      publicKeyLength: vapidPublicKey.length,
      privateKeyLength: vapidPrivateKey.length,
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    console.log("Sending push notification:", payload);

    if (!payload.user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No subscriptions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use a standards-compliant WebPush implementation (payload encryption + VAPID headers)
    let exportedKeys;
    try {
      exportedKeys = exportedVapidKeysFromBase64Url(vapidPublicKey, vapidPrivateKey);
      console.log("VAPID keys converted successfully");
    } catch (keyError) {
      console.error("Error converting VAPID keys:", keyError);
      throw new Error(`Invalid VAPID key format: ${keyError instanceof Error ? keyError.message : String(keyError)}`);
    }

    let importedVapidKeys;
    try {
      importedVapidKeys = await webpush.importVapidKeys(exportedKeys, { extractable: false });
      console.log("VAPID keys imported successfully");
    } catch (importError) {
      console.error("Error importing VAPID keys:", importError);
      throw new Error(
        `Failed to import VAPID keys: ${importError instanceof Error ? importError.message : String(importError)}`,
      );
    }

    let appServer;
    try {
      appServer = await webpush.ApplicationServer.new({
        contactInformation: vapidSubject, // This is critical for JWT generation
        vapidKeys: importedVapidKeys,
      });
      console.log("ApplicationServer created with subject:", vapidSubject);
    } catch (serverError) {
      console.error("Error creating ApplicationServer:", serverError);
      throw new Error(
        `Failed to create ApplicationServer: ${serverError instanceof Error ? serverError.message : String(serverError)}`,
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

        const subscriber = appServer.subscribe({
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.auth_key,
            p256dh: subscription.p256dh_key,
          },
        });

        await subscriber.pushTextMessage(pushPayload, {
          ttl: 86400,
          urgency: webpush.Urgency.High,
        });

        sentCount++;
      } catch (err: unknown) {
        if (err instanceof webpush.PushMessageError) {
          const responseText = await err.response.text().catch(() => "");
          console.error("Push failed:", err.response.status, responseText);

          if (err.isGone() || err.response.status === 404) {
            console.log("Removing expired subscription:", subscription.id);
            await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
          }

          errors.push(`${subscription.id}: ${err.response.status} - ${responseText || err.response.statusText}`);
        } else {
          console.error("Error sending push:", err);
          errors.push(`${subscription.id}: ${err instanceof Error ? err.message : String(err)}`);
        }
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

    console.log(`Push notification result: ${sentCount}/${subscriptions.length}`, errors.length ? errors : "no errors");

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        total: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in send-push-notification:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
