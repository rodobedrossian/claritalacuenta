import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isIOSNativeApp, hasPinConfigured, hasEncryptedSession } from "@/lib/iosAppPin";
import { IOSSplashScreen } from "./IOSSplashScreen";
import { PinUnlockScreen } from "./PinUnlockScreen";

/**
 * Wraps protected routes on iOS. Shows splash then PIN or Auth when no session.
 * PIN solo cuando hay sesión cifrada para restaurar; si no (ej. tras logout) → Auth.
 */
export function IOSAppGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading: authLoading } = useAuth();
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [hasEncryptedSess, setHasEncryptedSess] = useState<boolean | null>(null);
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

  // Fetch hasPin y (si hay PIN) hasEncryptedSession para decidir PIN vs Auth
  useEffect(() => {
    if (!isIOSNativeApp() || !isProtectedPath || hasPin !== null) return;
    hasPinConfigured().then(setHasPin);
  }, [isProtectedPath, hasPin]);

  useEffect(() => {
    if (!isIOSNativeApp() || !isProtectedPath || hasPin !== true) return;
    hasEncryptedSession().then(setHasEncryptedSess);
  }, [isProtectedPath, hasPin]);

  // Splash solo al abrir la app (sin sesión). Con sesión ir directo a contenido o set-pin.
  useEffect(() => {
    if (!isIOSNativeApp() || !isProtectedPath) return;
    if (authLoading) {
      setStage("loading");
      return;
    }
    if (hasPin === null) return;
    if (session) {
      if (hasPin === true) setStage("content");
    } else {
      if (hasPin === true && hasEncryptedSess === null) return;
      setStage("splash");
    }
  }, [isProtectedPath, authLoading, session, hasPin, hasEncryptedSess]);

  const handleSplashFinish = () => {
    if (session && hasPin === true) {
      setStage("content");
    } else if (session && hasPin === false) {
      navigate("/set-pin", { replace: true, state: { session } });
    } else if (!session && hasPin === true && hasEncryptedSess === true) {
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

  const splashReady =
    !authLoading &&
    hasPin !== null &&
    (hasPin === false || hasEncryptedSess !== null);

  if (authLoading || stage === "loading") {
    return (
      <IOSSplashScreen
        onFinish={handleSplashFinish}
        minDurationMs={2200}
        ready={splashReady}
      />
    );
  }

  // Con sesión pero hasPin aún no resuelto (ej. volviendo de set-pin): spinner breve, sin splash
  if (session && hasPin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session && hasPin === false) {
    navigate("/set-pin", { replace: true, state: { session } });
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
