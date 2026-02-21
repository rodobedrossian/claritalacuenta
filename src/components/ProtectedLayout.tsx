import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  isBiometricSupported,
  isBiometricEnabled,
} from "@/lib/biometricAuth";
import { BiometricGate } from "@/components/BiometricGate";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Layout that wraps all protected routes. Shows BiometricGate only when the
 * session is lost (no valid session) and Face ID is enabled; otherwise
 * renders the app without asking for Face ID.
 */
const ProtectedLayout = () => {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const noSession = !session && !authLoading;
  const showBiometricGate =
    noSession && isBiometricSupported() && isBiometricEnabled();

  useEffect(() => {
    if (noSession && !showBiometricGate) {
      navigate("/auth", { replace: true });
    }
  }, [noSession, showBiometricGate, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (session) return <Outlet />;

  if (showBiometricGate) {
    return (
      <BiometricGate>
        <Outlet />
      </BiometricGate>
    );
  }

  return null;
};

export default ProtectedLayout;
