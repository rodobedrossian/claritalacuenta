import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { setPin, saveEncryptedSession, isIOSNativeApp } from "@/lib/iosAppPin";
import { toast } from "sonner";
import { Loader2, Delete } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

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
    <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
      {digits.map((d) =>
        d === "" ? (
          <div key="empty" />
        ) : d === "back" ? (
          <Button
            key="back"
            variant="outline"
            size="lg"
            className="h-14"
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
            className="h-14 text-xl"
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

export function SetAppPinScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = (location.state as { session?: Session })?.session;

  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPinInput] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isIOSNativeApp()) {
    navigate("/", { replace: true });
    return null;
  }

  if (!session?.refresh_token) {
    navigate("/auth", { replace: true });
    return null;
  }

  const handleDigit = (d: string) => {
    setError(null);
    if (step === "create") {
      if (pin.length < PIN_LENGTH) setPinInput((p) => p + d);
    } else {
      if (confirmPin.length < PIN_LENGTH) setConfirmPin((p) => p + d);
    }
  };

  const handleBackspace = () => {
    setError(null);
    if (step === "create") {
      setPinInput((p) => p.slice(0, -1));
    } else {
      setConfirmPin((p) => p.slice(0, -1));
    }
  };

  const currentPin = step === "create" ? pin : confirmPin;
  const isComplete = currentPin.length === PIN_LENGTH;

  const handleContinue = async () => {
    if (step === "create") {
      setStep("confirm");
      setConfirmPin("");
      setError(null);
      return;
    }
    if (pin !== confirmPin) {
      setError("Los PIN no coinciden. Intentá de nuevo.");
      setConfirmPin("");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await setPin(pin);
      await saveEncryptedSession(pin, session.refresh_token);
      toast.success("PIN configurado");
      navigate("/", { replace: true });
    } catch (e) {
      console.error("[SetAppPin]", e);
      setError("No se pudo guardar el PIN. Intentá de nuevo.");
      toast.error("Error al guardar el PIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 safe-area-pb">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-center mb-1">
          {step === "create" ? "Creá tu PIN de Rucula" : "Confirmá tu PIN"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {step === "create"
            ? "Usá 6 dígitos para desbloquear la app en este dispositivo."
            : "Ingresá el mismo PIN de nuevo."}
        </p>
        <PinDots length={currentPin.length} />
        {error && <p className="text-sm text-destructive text-center mb-2">{error}</p>}
        <NumPad onDigit={handleDigit} onBackspace={handleBackspace} disabled={loading} />
        {isComplete && (
          <Button
            className="w-full mt-6"
            size="lg"
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : step === "create" ? "Continuar" : "Crear PIN"}
          </Button>
        )}
      </div>
    </div>
  );
}
