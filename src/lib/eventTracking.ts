/**
 * Event tracking service - stores user interactions in Supabase.
 * Completely non-blocking: failures never affect the user experience.
 */

import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

/** Context updated by EventTrackerProvider; used for all tracked events */
let trackingContext: {
  userId: string | null;
  workspaceId: string | null;
  path: string;
} = {
  userId: null,
  workspaceId: null,
  path: "/",
};

/** Cached device info (computed once per session) */
let cachedDeviceInfo: Record<string, string> | null = null;

function getDeviceInfo(): Record<string, string> {
  if (cachedDeviceInfo) return cachedDeviceInfo;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const platform = Capacitor.getPlatform(); // "ios" | "android" | "web"

  let device_type: "desktop" | "mobile" = "desktop";
  let os = "Unknown";

  if (platform === "ios") {
    device_type = "mobile";
    os = "iOS";
  } else if (platform === "android") {
    device_type = "mobile";
    os = "Android";
  } else {
    // Web: parse userAgent
    if (/iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      device_type = "mobile";
      if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
      else if (/Android/i.test(ua)) os = "Android";
      else os = "Mobile";
    } else {
      device_type = "desktop";
      if (/Win/i.test(ua)) os = "Windows";
      else if (/Mac/i.test(ua)) os = "macOS";
      else if (/Linux/i.test(ua)) os = "Linux";
    }
  }

  // Browser info for desktop (datos de navegación)
  let browser = "";
  if (typeof navigator !== "undefined") {
    const nav = navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } };
    if (nav.userAgentData?.brands?.length) {
      browser = nav.userAgentData.brands.map((b) => b.brand).join(", ");
    } else {
      if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = "Chrome";
      else if (/Firefox/i.test(ua)) browser = "Firefox";
      else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
      else if (/Edge/i.test(ua)) browser = "Edge";
    }
  }

  cachedDeviceInfo = {
    device_type,
    os,
    platform,
    ...(browser && { browser }),
  };
  return cachedDeviceInfo;
}

/**
 * Update tracking context. Called by EventTrackerProvider when auth/location/workspace changes.
 */
export function setEventTrackingContext(ctx: Partial<typeof trackingContext>) {
  trackingContext = { ...trackingContext, ...ctx };
}

/**
 * Track an event. Fire-and-forget; never blocks or throws.
 */
export function trackEvent(
  eventType: string,
  eventName: string,
  properties?: Record<string, unknown>
): void {
  queueMicrotask(() => {
    try {
      const deviceInfo = getDeviceInfo();
      const mergedProperties = {
        ...deviceInfo,
        ...(properties ?? {}),
      };

      const payload = {
        user_id: trackingContext.userId,
        workspace_id: trackingContext.workspaceId,
        event_type: eventType,
        event_name: eventName,
        properties: mergedProperties,
        path: trackingContext.path,
      };

      supabase.from("user_events").insert(payload).then(({ error }) => {
        if (error) {
          console.warn("[EventTracking] Insert failed:", error.message);
        }
      });
    } catch (err) {
      console.warn("[EventTracking] Unexpected error:", err);
    }
  });
}
