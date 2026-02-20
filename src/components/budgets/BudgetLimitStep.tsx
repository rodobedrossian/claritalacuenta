import { ChevronLeft, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BudgetLimitStepProps {
  currency: "USD" | "ARS" | "";
  availableCurrencies: ("USD" | "ARS")[];
  onCurrencyChange: (currency: "USD" | "ARS") => void;
  categoryName: string;
  monthlyLimit: string;
  onMonthlyLimitChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const BudgetLimitStep = ({
  currency,
  availableCurrencies,
  onCurrencyChange,
  categoryName,
  monthlyLimit,
  onMonthlyLimitChange,
  onBack,
  onSubmit,
  isSubmitting,
}: BudgetLimitStepProps) => {
  const handleKeyPress = (key: string) => {
    if (key === "backspace") {
      onMonthlyLimitChange(monthlyLimit.slice(0, -1));
    } else if (key === ".") {
      if (!monthlyLimit.includes(".")) {
        onMonthlyLimitChange(monthlyLimit + ".");
      }
    } else {
      const parts = monthlyLimit.split(".");
      if (parts[1] && parts[1].length >= 2) return;
      if (monthlyLimit.length >= 12) return;
      onMonthlyLimitChange(monthlyLimit + key);
    }
  };

  const formatDisplayAmount = () => {
    if (!monthlyLimit) return "0";
    const num = parseFloat(monthlyLimit);
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const canSubmit = !!currency && parseFloat(monthlyLimit) > 0;
  const showCurrencyToggle = availableCurrencies.length >= 2;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <Button type="button" variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h3 className="font-semibold text-lg">Límite mensual</h3>
          <p className="text-sm text-muted-foreground">{categoryName}</p>
        </div>
      </div>

      {showCurrencyToggle && (
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onCurrencyChange("ARS")}
            className={cn(
              "flex-1 h-12 text-lg font-semibold transition-all",
              currency === "ARS"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50"
            )}
          >
            ARS $
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onCurrencyChange("USD")}
            className={cn(
              "flex-1 h-12 text-lg font-semibold transition-all",
              currency === "USD"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50"
            )}
          >
            USD $
          </Button>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2">
        <div className="text-center">
          <span className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {currency || "—"} {formatDisplayAmount()}
          </span>
          <p className="text-sm text-muted-foreground mt-2">Máximo a gastar por mes</p>
        </div>
      </div>

      <div className="px-2 pb-2">
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map((key) => (
            <Button
              key={key}
              variant="ghost"
              className={`h-14 text-xl font-medium rounded-xl ${key === "backspace" ? "text-muted-foreground" : ""}`}
              onClick={() => handleKeyPress(key)}
            >
              {key === "backspace" ? <Delete className="h-6 w-6" /> : key}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 pt-2 border-t border-border/50">
        <Button
          className="w-full h-12 text-base font-medium"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "Creando..." : "Crear Presupuesto"}
        </Button>
      </div>
    </div>
  );
};
