import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isIOSNativeApp } from "@/lib/iosAppPin";
import { hasPinConfigured } from "@/lib/iosAppPin";
import { IOSSplashScreen } from "./IOSSplashScreen";
import { PinUnlockScreen } from "./PinUnlockScreen";

/**
 * Wraps protected routes on iOS. Shows splash then PIN or Auth when no session;
 * redirects to SetAppPin when session but no PIN; otherwise renders children.
 */
export function IOSAppGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading: authLoading } = useAuth();
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [stage, setStage] = useState<"loading" | "splash" | "pin" | "content">("loading");

  const isProtectedPath =
    location.pathname === "/" ||
    location.pathname.startsWith("/transactions") ||
    location.pathname.startsWith("/settings") ||
    location.pathname.startsWith("/savings") ||
    location.pathname.startsWith("/budgets") ||
    location.pathname.startsWith("/credit-cards") ||
    location.pathname.startsWith("/insights") ||
    location.pathname.startsWith("/categories") ||
    location.pathname.startsWith("/recurrentes") ||
    location.pathname.startsWith("/mas") ||
    location.pathname.startsWith("/legales");

  // Fetch hasPin as soon as we're on the gate (so splash can finish when auth is ready)
  useEffect(() => {
    if (!isIOSNativeApp() || !isProtectedPath || hasPin !== null) return;
    hasPinConfigured().then(setHasPin);
  }, [isProtectedPath, hasPin]);

  // When auth is ready and we have hasPin, show splash (or we're already showing it during authLoading)
  useEffect(() => {
    if (!isIOSNativeApp() || !isProtectedPath) return;
    if (authLoading) {
      setStage("loading");
      return;
    }
    if (hasPin !== null) {
      setStage("splash");
    }
  }, [isProtectedPath, authLoading, hasPin]);

  const handleSplashFinish = () => {
    if (session && hasPin === true) {
      setStage("content");
    } else if (session && hasPin === false) {
      navigate("/set-pin", { replace: true, state: { session } });
    } else if (!session && hasPin === true) {
      setStage("pin");
    } else {
      navigate("/auth", { replace: true });
    }
  };

  if (!isIOSNativeApp()) {
    return <Outlet />;
  }

  if (!isProtectedPath) {
    return <Outlet />;
  }

  // Show logo splash (not spinner) during initial load and during splash phase
  if (authLoading || (session && hasPin === null) || stage === "loading") {
    return (
      <IOSSplashScreen
        onFinish={handleSplashFinish}
        minDurationMs={2200}
        ready={!authLoading && hasPin !== null}
      />
    );
  }

  if (session && hasPin === false) {
    return null;
  }

  if (session && hasPin === true) {
    return <Outlet />;
  }

  if (stage === "splash") {
    return (
      <IOSSplashScreen
        onFinish={handleSplashFinish}
        minDurationMs={2200}
        ready
      />
    );
  }

  if (stage === "pin") {
    return <PinUnlockScreen />;
  }

  return <Outlet />;
}
