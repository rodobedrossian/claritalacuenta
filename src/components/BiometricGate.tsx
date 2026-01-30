import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  hasStoredCredentials,
  getStoredSession,
  isBiometricSupported,
  isBiometricEnabled,
} from "@/lib/biometricAuth";
import { Fingerprint, Loader2 } from "lucide-react";

interface BiometricGateProps {
  children: React.ReactNode;
}

/**
 * When biometric unlock is enabled (iOS), requires Face ID / passcode before
 * showing protected content. Otherwise renders children immediately.
 */
export function BiometricGate({ children }: BiometricGateProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "gate" | "unlocked">("checking");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!isBiometricSupported() || !isBiometricEnabled()) {
        if (mounted) setStatus("unlocked");
        return;
      }
      const stored = await hasStoredCredentials();
      if (!mounted) return;
      // No credentials in Keychain → user must log in again
      if (!stored) {
        navigate("/auth", { replace: true });
        return;
      }
      setStatus("gate");
    };

    run();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  // Auto-prompt Face ID / passcode when gate is shown
  useEffect(() => {
    if (status !== "gate") return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const session = await getStoredSession();
        if (!mounted) return;
        if (!session) {
          setLoading(false);
          return;
        }
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        if (mounted) setStatus("unlocked");
      } catch {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [status]);

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const session = await getStoredSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      setStatus("unlocked");
    } catch {
      navigate("/auth", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/auth", { replace: true });
  };

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (status === "gate") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 max-w-sm w-full">
          <div className="p-4 rounded-full bg-primary/10">
            <Fingerprint className="h-12 w-12 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold tracking-tight">Desbloquear</h1>
            <p className="text-sm text-muted-foreground">
              Usá Face ID o el código de tu teléfono para entrar
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button
              className="w-full"
              size="lg"
              onClick={handleUnlock}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Desbloquear"
              )}
            </Button>
            <Button variant="ghost" onClick={handleCancel} disabled={loading}>
              Usar contraseña
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
