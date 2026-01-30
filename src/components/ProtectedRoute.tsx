import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import {
  isBiometricSupported,
  isBiometricEnabled,
} from "@/lib/biometricAuth";
import { BiometricGate } from "@/components/BiometricGate";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
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

      // When Face ID is enabled, ALWAYS require verification - never use Supabase's
      // persisted session directly. This ensures Face ID is prompted on every app open.
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
    return <BiometricGate>{children}</BiometricGate>;
  }

  if (!session) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
