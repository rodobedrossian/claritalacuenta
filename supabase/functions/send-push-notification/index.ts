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

function exportedVapidKeysFromBase64Url(
  publicKeyB64: string,
  privateKeyB64: string,
): webpush.ExportedVapidKeys {
  const publicKeyBytes = base64UrlDecode(publicKeyB64);
  const privateKeyBytes = base64UrlDecode(privateKeyB64);

  if (publicKeyBytes.length !== 65) {
    throw new Error(`Invalid VAPID public key length: ${publicKeyBytes.length} (expected 65)`);
  }
  if (privateKeyBytes.length !== 32) {
    throw new Error(`Invalid VAPID private key length: ${privateKeyBytes.length} (expected 32)`);
  }

  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);

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

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidSubject = normalizeVapidSubject(
      Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@financeflow.app",
    );

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
    const exportedKeys = exportedVapidKeysFromBase64Url(vapidPublicKey, vapidPrivateKey);
    const importedVapidKeys = await webpush.importVapidKeys(exportedKeys, { extractable: false });
    const appServer = await webpush.ApplicationServer.new({
      contactInformation: vapidSubject,
      vapidKeys: importedVapidKeys,
    });

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
