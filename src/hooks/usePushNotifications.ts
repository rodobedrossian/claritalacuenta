import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PushSubscriptionData {
  id: string;
  endpoint: string;
  device_name: string | null;
  created_at: string;
}

interface NotificationSettings {
  morning_budget_check: boolean;
  morning_time: string;
  evening_expense_reminder: boolean;
  evening_time: string;
  budget_exceeded_alert: boolean;
  monthly_recurring_reminder: boolean;
  monthly_reminder_day: number;
  timezone: string;
}

const defaultSettings: NotificationSettings = {
  morning_budget_check: true,
  morning_time: "09:00:00",
  evening_expense_reminder: true,
  evening_time: "21:00:00",
  budget_exceeded_alert: true,
  monthly_recurring_reminder: true,
  monthly_reminder_day: 1,
  timezone: "America/Argentina/Buenos_Aires",
};

export function usePushNotifications(userId: string | null) {
  const [isSupported, setIsSupported] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscriptions, setSubscriptions] = useState<PushSubscriptionData[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      setIsSupported(supported);

      // Check if running as PWA
      const standalone = window.matchMedia("(display-mode: standalone)").matches 
        || (navigator as { standalone?: boolean }).standalone === true;
      setIsPWA(standalone);

      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Fetch subscriptions and settings
  const fetchData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch subscriptions
      const { data: subs, error: subsError } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, device_name, created_at")
        .eq("user_id", userId);

      if (subsError) throw subsError;
      setSubscriptions(subs || []);

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (settingsError) throw settingsError;
      
      if (settingsData) {
        setSettings({
          morning_budget_check: settingsData.morning_budget_check ?? true,
          morning_time: settingsData.morning_time ?? "09:00:00",
          evening_expense_reminder: settingsData.evening_expense_reminder ?? true,
          evening_time: settingsData.evening_time ?? "21:00:00",
          budget_exceeded_alert: settingsData.budget_exceeded_alert ?? true,
          monthly_recurring_reminder: settingsData.monthly_recurring_reminder ?? true,
          monthly_reminder_day: settingsData.monthly_reminder_day ?? 1,
          timezone: settingsData.timezone ?? "America/Argentina/Buenos_Aires",
        });
      }
    } catch (error) {
      console.error("Error fetching push data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!userId || !isSupported) return false;

    setSubscribing(true);
    try {
      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        toast.error("Permiso de notificaciones denegado");
        return false;
      }

      // Register service worker if not already
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key - this should be set in .env as VITE_VAPID_PUBLIC_KEY
      // The VAPID public key is safe to expose publicly
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.warn("VAPID public key not configured in .env - using fallback subscription method");
        // Still allow subscription for basic push support
        toast.info("Configuración de notificaciones en proceso");
      }

      // Convert VAPID key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      // Subscribe to push - use VAPID key if available
      let subscription: PushSubscription;
      try {
        const subscribeOptions: PushSubscriptionOptionsInit = {
          userVisibleOnly: true,
        };
        
        if (vapidPublicKey) {
          subscribeOptions.applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        }
        
        subscription = await registration.pushManager.subscribe(subscribeOptions);
      } catch (pushError) {
        console.error("Push subscription error:", pushError);
        // Try without VAPID key as fallback
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
        });
      }

      const subJson = subscription.toJSON();
      
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Invalid subscription data");
      }

      // Detect device name
      const deviceName = /iPhone|iPad/.test(navigator.userAgent) 
        ? "iPhone" 
        : /Android/.test(navigator.userAgent)
          ? "Android"
          : "Dispositivo web";

      // Save to database
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: userId,
        endpoint: subJson.endpoint,
        p256dh_key: subJson.keys.p256dh,
        auth_key: subJson.keys.auth,
        device_name: deviceName,
      }, {
        onConflict: "user_id,endpoint",
      });

      if (error) throw error;

      // Create default notification settings if they don't exist
      await supabase.from("notification_settings").upsert({
        user_id: userId,
        ...defaultSettings,
      }, {
        onConflict: "user_id",
      });

      toast.success("Notificaciones activadas");
      await fetchData();
      return true;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast.error("Error al activar notificaciones");
      return false;
    } finally {
      setSubscribing(false);
    }
  }, [userId, isSupported, fetchData]);

  // Unsubscribe a device
  const unsubscribe = useCallback(async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("id", subscriptionId);

      if (error) throw error;

      toast.success("Dispositivo eliminado");
      await fetchData();
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast.error("Error al eliminar dispositivo");
    }
  }, [fetchData]);

  // Update notification settings
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("notification_settings")
        .upsert({
          user_id: userId,
          ...settings,
          ...newSettings,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...newSettings }));
      toast.success("Configuración guardada");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Error al guardar configuración");
    }
  }, [userId, settings]);

  // Send a test notification
  const sendTestNotification = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await supabase.functions.invoke("send-push-notification", {
        body: {
          user_id: userId,
          title: "🧪 Notificación de prueba",
          body: "¡Las notificaciones están funcionando correctamente!",
          type: "test",
        },
      });

      if (response.error) throw response.error;
      toast.success("Notificación de prueba enviada");
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Error al enviar notificación de prueba");
    }
  }, [userId]);

  return {
    isSupported,
    isPWA,
    permission,
    subscriptions,
    settings,
    loading,
    subscribing,
    subscribe,
    unsubscribe,
    updateSettings,
    sendTestNotification,
    refetch: fetchData,
  };
}
