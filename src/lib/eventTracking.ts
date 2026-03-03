/**
 * Event tracking service - stores user interactions in Supabase.
 * Completely non-blocking: failures never affect the user experience.
 */

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
      const payload = {
        user_id: trackingContext.userId,
        workspace_id: trackingContext.workspaceId,
        event_type: eventType,
        event_name: eventName,
        properties: properties ?? {},
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
