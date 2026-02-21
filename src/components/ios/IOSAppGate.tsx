import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (!isIOSNativeApp()) return;
    if (!isProtectedPath) return;
    if (authLoading) {
      setStage("loading");
      return;
    }
    if (session) {
      hasPinConfigured().then((configured) => {
        setHasPin(configured);
        if (configured) {
          setStage("content");
        } else {
          navigate("/set-pin", { replace: true, state: { session } });
        }
      });
      return;
    }
    // No session - need hasPin to decide pin vs auth
    if (hasPin === null) {
      hasPinConfigured().then((configured) => {
        setHasPin(configured);
        setStage("splash");
      });
    }
  }, [isProtectedPath, authLoading, session, hasPin, navigate]);

  const handleSplashFinish = () => {
    if (hasPin === true) {
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

  if (authLoading || (session && hasPin === null)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session && hasPin === false) {
    return null;
  }

  if (session && hasPin === true) {
    return <Outlet />;
  }

  if (stage === "splash") {
    return <IOSSplashScreen onFinish={handleSplashFinish} />;
  }

  if (stage === "pin") {
    return <PinUnlockScreen />;
  }

  return <Outlet />;
}
