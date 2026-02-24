/**
 * Push Notifications: registro y listeners para apps nativas (Android FCM / iOS APNs).
 * En navegador no hace nada. En Android/iOS registra y envía el token al backend.
 * Para pruebas el token queda en window.__FCM_TOKEN__ y en consola.
 */
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import type { SupabaseClient } from "@supabase/supabase-js";

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();

export async function initPushNotifications(supabase: SupabaseClient) {
  console.log("[Push] initPushNotifications called", { isNative, platform });
  if (!isNative || (platform !== "android" && platform !== "ios")) {
    console.log("[Push] Skipped: not native or platform not android/ios");
    return;
  }

  try {
    const { receive } = await PushNotifications.requestPermissions();
    if (receive !== "granted") {
      console.warn("[Push] Permisos no concedidos:", receive);
      return;
    }

    await PushNotifications.register();
  } catch (err) {
    console.error("[Push] Error al registrar:", err);
    return;
  }

  PushNotifications.addListener("registration", async (ev) => {
    const token = ev.value;
    console.log("[Push] Token:", token);
    if (typeof window !== "undefined") (window as unknown as { __FCM_TOKEN__?: string }).__FCM_TOKEN__ = token;

    try {
      console.log("[Push] Calling register-push-token Edge Function...");
      const { data, error } = await supabase.functions.invoke("register-push-token", {
        body: {
          platform: platform as "android" | "ios",
          token,
          device_name: platform === "android" ? "Android" : "iOS",
        },
      });
      if (error) console.error("[Push] Error al registrar token en backend:", error);
      else console.log("[Push] register-push-token success", data);
    } catch (e) {
      console.error("[Push] Error al llamar register-push-token:", e);
    }
  });

  PushNotifications.addListener("registrationError", (err) =>
    console.error("[Push] Error de registro:", err.error)
  );
  PushNotifications.addListener("pushNotificationReceived", (n) => console.log("[Push] Recibida:", n));
  PushNotifications.addListener("pushNotificationActionPerformed", (a) => console.log("[Push] Acción:", a));
}
