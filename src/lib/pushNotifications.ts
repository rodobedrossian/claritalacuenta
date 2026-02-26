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

const PLUGIN_NOT_READY = /not implemented|plugin is not implemented/i;

/** Espera a que el plugin PushNotifications esté disponible (útil cuando la app carga desde URL remota). */
function waitForPushPlugin(timeoutMs = 15000): Promise<void> {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const intervalMs = 500;

    const tryOnce = () => {
      PushNotifications.checkPermissions()
        .then(() => {
          console.log("[Push] Plugin listo");
          resolve();
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          if (Date.now() > deadline) {
            reject(new Error("[Push] Plugin no disponible a tiempo: " + msg));
            return;
          }
          if (PLUGIN_NOT_READY.test(msg)) {
            setTimeout(tryOnce, intervalMs);
          } else {
            reject(err);
          }
        });
    };
    tryOnce();
  });
}

export async function initPushNotifications(supabase: SupabaseClient) {
  console.log("[Push] initPushNotifications called", { isNative, platform });
  if (!isNative || (platform !== "android" && platform !== "ios")) {
    console.log("[Push] Skipped: not native or platform not android/ios");
    return;
  }

  try {
    await waitForPushPlugin(15000);
  } catch (err) {
    console.warn("[Push] No se pudo esperar al plugin:", err);
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
