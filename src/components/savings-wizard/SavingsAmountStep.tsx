import { Banknote, PiggyBank, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SavingsSource = "balance" | "previous";

interface SavingsAmountStepProps {
  source: SavingsSource;
  currency: "USD" | "ARS" | "";
  amount: string;
  availableBalanceUSD: number;
  availableBalanceARS: number;
  onSourceChange: (source: SavingsSource) => void;
  onCurrencyChange: (currency: "USD" | "ARS") => void;
  onAmountChange: (amount: string) => void;
  onNext: () => void;
}

export const SavingsAmountStep = ({
  source,
  currency,
  amount,
  availableBalanceUSD,
  availableBalanceARS,
  onSourceChange,
  onCurrencyChange,
  onAmountChange,
  onNext,
}: SavingsAmountStepProps) => {
  const hasBalance = availableBalanceUSD > 0 || availableBalanceARS > 0;
  
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

  const handleUseMax = () => {
    if (!currency) return;
    const maxAmount = currency === "USD" ? availableBalanceUSD : availableBalanceARS;
    onAmountChange(maxAmount.toString());
  };

  const getAvailableForCurrency = (curr: "USD" | "ARS") => {
    return curr === "USD" ? availableBalanceUSD : availableBalanceARS;
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

  const formatCurrency = (value: number, curr: "USD" | "ARS") => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const canProceed = currency && parseFloat(amount) > 0;

  // Check if amount exceeds available balance when source is "balance"
  const exceedsBalance = source === "balance" && currency && parseFloat(amount) > getAvailableForCurrency(currency as "USD" | "ARS");

  return (
    <div className="flex flex-col h-full">
      {/* Source selection */}
      <div className="px-4 py-3 space-y-3">
        <p className="text-sm text-muted-foreground text-center">¿De dónde viene este ahorro?</p>
        <div className="space-y-2">
          {hasBalance && (
            <button
              onClick={() => onSourceChange("balance")}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                source === "balance"
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${source === "balance" ? "bg-primary/20" : "bg-muted"}`}>
                  <Banknote className={`h-5 w-5 ${source === "balance" ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Del balance del mes</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(availableBalanceARS, "ARS")} / {formatCurrency(availableBalanceUSD, "USD")}
                  </p>
                </div>
              </div>
            </button>
          )}
          
          <button
            onClick={() => onSourceChange("previous")}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              source === "previous"
                ? "border-primary bg-primary/5"
                : "border-border/50 hover:border-primary/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${source === "previous" ? "bg-primary/20" : "bg-muted"}`}>
                <PiggyBank className={`h-5 w-5 ${source === "previous" ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-medium text-sm">Ya lo tenía guardado</p>
                <p className="text-xs text-muted-foreground">Registrar ahorro existente</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Currency selector */}
      <div className="flex justify-center gap-4 py-3">
        {(["ARS", "USD"] as const).map((curr) => {
          const available = getAvailableForCurrency(curr);
          const isDisabled = source === "balance" && available <= 0;
          
          return (
            <button
              key={curr}
              onClick={() => !isDisabled && onCurrencyChange(curr)}
              disabled={isDisabled}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                currency === curr
                  ? "bg-primary text-primary-foreground"
                  : isDisabled
                    ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {curr === "ARS" ? "ARS $" : "USD $"}
            </button>
          );
        })}
      </div>

      {/* Amount display */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2">
        <div className="text-center">
          <span className={`text-5xl md:text-6xl font-bold tracking-tight text-primary`}>
            {currency || "ARS"} {formatDisplayAmount()}
          </span>
          <p className="text-sm text-muted-foreground mt-2">
            {source === "balance" ? "Monto a transferir a ahorros" : "Monto a registrar"}
          </p>
          {source === "balance" && currency && (
            <p className="text-xs text-muted-foreground mt-1">
              Disponible: {formatCurrency(getAvailableForCurrency(currency as "USD" | "ARS"), currency as "USD" | "ARS")}
            </p>
          )}
          {exceedsBalance && (
            <p className="text-xs text-destructive mt-1">
              Excede el balance disponible
            </p>
          )}
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

        {/* Use max button for balance source */}
        {source === "balance" && currency && (
          <Button
            variant="outline"
            className="w-full mt-3 max-w-xs mx-auto block"
            onClick={handleUseMax}
          >
            Usar máximo ({formatCurrency(getAvailableForCurrency(currency as "USD" | "ARS"), currency as "USD" | "ARS")})
          </Button>
        )}
      </div>

      {/* Continue button */}
      <div className="p-4 border-t border-border/50">
        <Button
          className="w-full h-12 text-base font-medium"
          onClick={onNext}
          disabled={!canProceed || !!exceedsBalance}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
