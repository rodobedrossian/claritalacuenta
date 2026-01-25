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

// Helper to detect platform
const detectPlatform = (): 'android' | 'ios' | 'desktop' => {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  return 'desktop';
};

// Helper to get browser name
const getBrowserName = (): string => {
  const ua = navigator.userAgent;
  if (/CriOS/.test(ua)) return 'Chrome';
  if (/FxiOS/.test(ua)) return 'Firefox';
  if (/OPiOS/.test(ua)) return 'Opera';
  if (/EdgiOS|Edg/.test(ua)) return 'Edge';
  if (/Chrome/.test(ua)) return 'Chrome';
  if (/Firefox/.test(ua)) return 'Firefox';
  if (/Safari/.test(ua)) return 'Safari';
  return 'Browser';
};

// Helper to get descriptive device name
const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  const browser = getBrowserName();
  
  if (/android/i.test(ua)) return `Android - ${browser}`;
  if (/iphone/i.test(ua)) return 'iPhone';
  if (/ipad/i.test(ua)) return 'iPad';
  if (/macintosh/i.test(ua)) return `Mac - ${browser}`;
  if (/windows/i.test(ua)) return `Windows - ${browser}`;
  if (/linux/i.test(ua)) return `Linux - ${browser}`;
  return `Web - ${browser}`;
};

export function usePushNotifications(userId: string | null) {
  const [isSupported, setIsSupported] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('desktop');
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

      // Detect platform
      setPlatform(detectPlatform());

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

      // Fetch VAPID public key from backend
      let vapidPublicKey: string | null = null;
      try {
        const response = await supabase.functions.invoke("get-vapid-key");
        if (response.data?.vapidPublicKey) {
          vapidPublicKey = response.data.vapidPublicKey;
        } else {
          console.error("Failed to get VAPID key:", response.error);
        }
      } catch (err) {
        console.error("Error fetching VAPID key:", err);
      }
      
      if (!vapidPublicKey) {
        toast.error("Error de configuración de notificaciones");
        return false;
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

      // Subscribe to push with VAPID key
      let subscription: PushSubscription;
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      } catch (pushError) {
        console.error("Push subscription error:", pushError);
        toast.error("Error al suscribirse a notificaciones");
        return false;
      }

      const subJson = subscription.toJSON();
      
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Invalid subscription data");
      }

      // Detect device name with more detail
      const deviceName = getDeviceName();

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

  // Reset subscription (delete current device's subscription and re-subscribe)
  const resetSubscription = useCallback(async () => {
    if (!userId || !isSupported) return false;

    setSubscribing(true);
    try {
      // First, unsubscribe from push manager if there's an active subscription
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        // Find and delete matching subscription from database
        const endpoint = existingSubscription.endpoint;
        const { error: deleteError } = await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("endpoint", endpoint);

        if (deleteError) {
          console.error("Error deleting old subscription:", deleteError);
        }

        // Unsubscribe from push manager
        await existingSubscription.unsubscribe();
        console.log("Old subscription removed from push manager");
      }

      // Delete all subscriptions for this user from database (cleanup)
      const { error: cleanupError } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId);

      if (cleanupError) {
        console.error("Error cleaning up subscriptions:", cleanupError);
      }

      // Now create a fresh subscription
      const success = await subscribe();
      
      if (success) {
        toast.success("Suscripción reseteada correctamente");
      }
      
      return success;
    } catch (error) {
      console.error("Error resetting subscription:", error);
      toast.error("Error al resetear suscripción");
      return false;
    } finally {
      setSubscribing(false);
    }
  }, [userId, isSupported, subscribe]);

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
    platform,
    permission,
    subscriptions,
    settings,
    loading,
    subscribing,
    subscribe,
    unsubscribe,
    resetSubscription,
    updateSettings,
    sendTestNotification,
    refetch: fetchData,
  };
}
