import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  getSessionWithPin,
  clearPinData,
  isIOSNativeApp,
} from "@/lib/iosAppPin";
import { getLastUser } from "@/lib/authStorage";
import { toast } from "sonner";
import { Loader2, Delete } from "lucide-react";

const PIN_LENGTH = 6;

function PinDots({ length }: { length: number }) {
  return (
    <div className="flex justify-center gap-2 my-4">
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full border-2 transition-colors ${
            i < length ? "bg-primary border-primary" : "border-muted-foreground/50"
          }`}
        />
      ))}
    </div>
  );
}

function NumPad({
  onDigit,
  onBackspace,
  disabled,
}: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];
  return (
    <div className="grid grid-cols-3 gap-4 max-w-[320px] mx-auto">
      {digits.map((d) =>
        d === "" ? (
          <div key="empty" />
        ) : d === "back" ? (
          <Button
            key="back"
            variant="outline"
            size="lg"
            className="h-16 min-h-16 text-lg"
            onClick={onBackspace}
            disabled={disabled}
          >
            <Delete className="w-6 h-6" />
          </Button>
        ) : (
          <Button
            key={d}
            variant="outline"
            size="lg"
            className="h-16 min-h-16 text-2xl"
            onClick={() => onDigit(d)}
            disabled={disabled}
          >
            {d}
          </Button>
        )
      )}
    </div>
  );
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function PinUnlockScreen() {
  const navigate = useNavigate();
  const lastUser = getLastUser();

  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const verifyingRef = useRef(false);

  if (!isIOSNativeApp()) {
    navigate("/", { replace: true });
    return null;
  }

  const handleDigit = (d: string) => {
    setError(null);
    if (pin.length < PIN_LENGTH) setPin((p) => p + d);
  };

  const handleBackspace = () => {
    setError(null);
    setPin((p) => p.slice(0, -1));
  };

  const verifyAndUnlock = async (pinValue: string) => {
    if (pinValue.length !== PIN_LENGTH || verifyingRef.current) return;
    verifyingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await getSessionWithPin(pinValue);
      if (result === null) {
        setPin("");
        setError("PIN incorrecto. Intentá de nuevo.");
        setShake(true);
        setTimeout(() => setShake(false), 400);
        return;
      }
      if ("needPassword" in result) {
        toast.info("Tu sesión se cerró. Ingresá tu contraseña para continuar.");
        navigate("/auth", { replace: true });
        return;
      }
      await supabase.auth.setSession({ refresh_token: result.refresh_token });
      toast.success("Bienvenido");
      navigate("/", { replace: true });
    } catch (e) {
      console.error("[PinUnlock]", e);
      setPin("");
      setError("PIN incorrecto. Intentá de nuevo.");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
      verifyingRef.current = false;
    }
  };

  // Al completar 6 dígitos, verificar y entrar (sin botón Desbloquear)
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      verifyAndUnlock(pin);
    }
  }, [pin]);

  const handleForgotPin = async () => {
    await clearPinData();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 safe-area-pb">
      <div
        className={`w-full max-w-sm transition-transform ${shake ? "animate-shake" : ""}`}
      >
        {lastUser && (
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold text-primary-foreground mb-2"
              style={{ backgroundColor: "hsl(152 48% 38%)" }}
            >
              {getInitials(lastUser.full_name || null, lastUser.email)}
            </div>
            <p className="text-base font-semibold text-foreground">
              {lastUser.full_name || lastUser.email}
            </p>
          </div>
        )}
        <h1 className="text-xl font-bold text-center mb-1">Ingresá tu clave</h1>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Usá el PIN de 6 dígitos de Rucula para este dispositivo
        </p>
        <PinDots length={pin.length} />
        {error && <p className="text-sm text-destructive text-center mb-2">{error}</p>}
        {loading && (
          <div className="flex justify-center my-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <NumPad onDigit={handleDigit} onBackspace={handleBackspace} disabled={loading} />
        <Button
          variant="ghost"
          className="w-full mt-6 text-muted-foreground"
          onClick={handleForgotPin}
          disabled={loading}
        >
          Olvidé mi PIN
        </Button>
      </div>
    </div>
  );
}
