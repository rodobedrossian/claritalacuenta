import { useEffect, useState, useRef } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import {
  isBiometricSupported,
  isBiometricEnabled,
} from "@/lib/biometricAuth";
import { BiometricGate } from "@/components/BiometricGate";

/**
 * Layout that wraps all protected routes. Shows BiometricGate once per app session
 * when Face ID is enabled; uses Outlet so child routes don't remount the gate.
 */
const ProtectedLayout = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [useBiometricGate, setUseBiometricGate] = useState(false);
  const navigate = useNavigate();
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const supported = isBiometricSupported();
      const enabled = isBiometricEnabled();

      if (!mounted) return;
      if (supported && enabled) {
        setUseBiometricGate(true);
        setLoading(false);
        return;
      }

      const { data: { session: s } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(s);
      if (!s) {
        navigate("/auth", { replace: true });
        setLoading(false);
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, s) => {
          setSession(s);
          if (!s) navigate("/auth", { replace: true });
        }
      );
      unsubRef.current = () => subscription.unsubscribe();
      setLoading(false);
    })();

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (useBiometricGate) {
    return (
      <BiometricGate>
        <Outlet />
      </BiometricGate>
    );
  }

  if (!session) return null;

  return <Outlet />;
};

export default ProtectedLayout;
