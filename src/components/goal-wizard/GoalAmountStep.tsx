import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoalAmountStepProps {
  currency: "USD" | "ARS" | "";
  amount: string;
  onCurrencyChange: (currency: "USD" | "ARS") => void;
  onAmountChange: (amount: string) => void;
  onNext: () => void;
}

export const GoalAmountStep = ({
  currency,
  amount,
  onCurrencyChange,
  onAmountChange,
  onNext,
}: GoalAmountStepProps) => {
  const handleKeyPress = (key: string) => {
    if (key === "backspace") {
      onAmountChange(amount.slice(0, -1));
    } else if (key === ".") {
      if (!amount.includes(".")) {
        onAmountChange(amount + ".");
      }
    } else {
      // Limit to 2 decimal places
      const parts = amount.split(".");
      if (parts[1] && parts[1].length >= 2) return;
      // Limit total length
      if (amount.length >= 12) return;
      onAmountChange(amount + key);
    }
  };

  const formatDisplayAmount = () => {
    if (!amount) return "0";
    const num = parseFloat(amount);
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const canProceed = currency && parseFloat(amount) > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold text-center">Nuevo Objetivo</h2>
        <p className="text-sm text-muted-foreground text-center mt-1">¿Cuánto querés ahorrar?</p>
      </div>

      {/* Currency selector */}
      <div className="flex justify-center gap-4 py-4">
        {(["ARS", "USD"] as const).map((curr) => (
          <button
            key={curr}
            onClick={() => onCurrencyChange(curr)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              currency === curr
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {curr === "ARS" ? "ARS $" : "USD $"}
          </button>
        ))}
      </div>

      {/* Amount display */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2">
        <div className="text-center">
          <span className="text-5xl md:text-6xl font-bold tracking-tight text-secondary">
            {currency || "ARS"} {formatDisplayAmount()}
          </span>
          <p className="text-sm text-muted-foreground mt-2">
            Meta de ahorro
          </p>
        </div>
      </div>

      {/* Keypad */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map((key) => (
            <Button
              key={key}
              variant="ghost"
              className={`h-14 text-xl font-medium rounded-xl ${
                key === "backspace" ? "text-muted-foreground" : ""
              }`}
              onClick={() => handleKeyPress(key)}
              disabled={!currency}
            >
              {key === "backspace" ? <Delete className="h-6 w-6" /> : key}
            </Button>
          ))}
        </div>
      </div>

      {/* Continue button */}
      <div className="p-4 border-t border-border/50">
        <Button
          className="w-full h-12 text-base font-medium"
          onClick={onNext}
          disabled={!canProceed}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
