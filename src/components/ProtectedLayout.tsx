import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  isBiometricSupported,
  isBiometricEnabled,
} from "@/lib/biometricAuth";
import { BiometricGate } from "@/components/BiometricGate";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Layout that wraps all protected routes. Shows BiometricGate once per app session
 * when Face ID is enabled; uses Outlet so child routes don't remount the gate.
 */
const ProtectedLayout = () => {
  const { session, loading: authLoading } = useAuth();
  const [useBiometricGate, setUseBiometricGate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isBiometricSupported() && isBiometricEnabled()) {
      setUseBiometricGate(true);
    }
  }, []);

  useEffect(() => {
    if (useBiometricGate) return;
    if (authLoading) return;
    if (!session) {
      navigate("/auth", { replace: true });
    }
  }, [session, authLoading, useBiometricGate, navigate]);

  if (useBiometricGate) {
    return (
      <BiometricGate>
        <Outlet />
      </BiometricGate>
    );
  }

  if (session) return <Outlet />;

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

  if (!session) return null;

  return <Outlet />;
};

export default ProtectedLayout;
