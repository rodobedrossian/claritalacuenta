import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  setEventTrackingContext,
  trackEvent,
} from "@/lib/eventTracking";

const INTERACTIVE_SELECTOR =
  "button, a[href], [role='button'], [role='tab'], [role='menuitem'], [role='link'], input, select, textarea, [data-track-event]";

function getClickTarget(el: EventTarget | null): Element | null {
  if (!el || !(el instanceof Element)) return null;
  const interactive = el.closest?.(INTERACTIVE_SELECTOR);
  return interactive ?? null;
}

function deriveClickEventName(target: Element): string {
  const dataEvent = target.getAttribute?.("data-track-event");
  if (dataEvent) return dataEvent;

  const tag = target.tagName?.toLowerCase();
  const role = target.getAttribute?.("role");

  if (role === "tab") return "tab_click";
  if (tag === "a") return "link_click";
  if (tag === "button" || role === "button") return "button_click";
  if (tag === "input" || tag === "select" || tag === "textarea") return "input_click";

  return "element_click";
}

function getClickProperties(target: Element): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  const label =
    target.getAttribute?.("data-track-label") ??
    target.getAttribute?.("aria-label") ??
    (target as HTMLElement).innerText?.trim?.()?.slice(0, 100);
  if (label) props.label = label;

  const dataEvent = target.getAttribute?.("data-track-event");
  if (dataEvent?.startsWith("nav_bar_")) props.source = "nav_bar";

  const href = (target as HTMLAnchorElement).href;
  if (href) props.href = href;

  const value = (target as HTMLInputElement).value;
  if (value !== undefined && value !== "") props.value = value;

  const dataValue = target.getAttribute?.("data-track-value");
  if (dataValue) props.tab_value = dataValue;

  props.element = target.tagName?.toLowerCase() ?? "unknown";

  return props;
}

export function EventTrackerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { workspaceId } = useWorkspace(user?.id ?? null);
  const prevPathRef = useRef<string | null>(null);
  const isInitialMount = useRef(true);

  // Sync context when auth/location/workspace changes
  useEffect(() => {
    setEventTrackingContext({
      userId: user?.id ?? null,
      workspaceId: workspaceId ?? null,
      path: pathname,
    });
  }, [user?.id, workspaceId, pathname]);

  // Track navigation
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevPathRef.current = pathname;
      trackEvent("navigation", "page_view", { to: pathname });
      return;
    }

    const from = prevPathRef.current;
    prevPathRef.current = pathname;
    trackEvent("navigation", "page_view", { to: pathname, from });
  }, [pathname]);

  // Global click listener (capture phase)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = getClickTarget(e.target);
      if (!target) return;

      const eventName = deriveClickEventName(target);
      const properties = getClickProperties(target);
      trackEvent("click", eventName, properties);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // Global form submit listener
  useEffect(() => {
    const handleSubmit = (e: Event) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;

      const formId = form.id || form.name || "unknown";
      const formAction = form.action || undefined;
      trackEvent("form_submit", formId, { formAction });
    };

    document.addEventListener("submit", handleSubmit, true);
    return () => document.removeEventListener("submit", handleSubmit, true);
  }, []);

  return <>{children}</>;
}
