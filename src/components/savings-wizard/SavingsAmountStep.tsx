import { ArrowDownCircle, ArrowUpCircle, Delete, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SavingsAmountStepProps {
  entryType: "deposit" | "withdrawal" | "interest";
  currency: "USD" | "ARS" | "";
  amount: string;
  onEntryTypeChange: (type: "deposit" | "withdrawal" | "interest") => void;
  onCurrencyChange: (currency: "USD" | "ARS") => void;
  onAmountChange: (amount: string) => void;
  onNext: () => void;
}

export const SavingsAmountStep = ({
  entryType,
  currency,
  amount,
  onEntryTypeChange,
  onCurrencyChange,
  onAmountChange,
  onNext,
}: SavingsAmountStepProps) => {
  const handleKeyPress = (key: string) => {
    if (key === "backspace") {
      onAmountChange(amount.slice(0, -1));
    } else if (key === "." && !amount.includes(".")) {
      onAmountChange(amount + ".");
    } else if (key !== ".") {
      // Limit to 2 decimal places
      const parts = amount.split(".");
      if (parts[1] && parts[1].length >= 2) return;
      // Limit total length
      if (amount.length >= 12) return;
      onAmountChange(amount + key);
    }
  };

  const displayAmount = amount || "0";
  const canProceed = !!currency && parseFloat(amount) > 0;

  const getTypeColor = () => {
    switch (entryType) {
      case "deposit":
        return "text-success";
      case "withdrawal":
        return "text-destructive";
      case "interest":
        return "text-primary";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Entry Type Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg mb-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onEntryTypeChange("deposit")}
          className={cn(
            "flex-1 gap-1.5 transition-all text-sm px-2",
            entryType === "deposit" 
              ? "bg-success/20 text-success hover:bg-success/30" 
              : "hover:bg-muted-foreground/10"
          )}
        >
          <ArrowDownCircle className="h-4 w-4" />
          Depósito
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onEntryTypeChange("withdrawal")}
          className={cn(
            "flex-1 gap-1.5 transition-all text-sm px-2",
            entryType === "withdrawal" 
              ? "bg-destructive/20 text-destructive hover:bg-destructive/30" 
              : "hover:bg-muted-foreground/10"
          )}
        >
          <ArrowUpCircle className="h-4 w-4" />
          Retiro
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onEntryTypeChange("interest")}
          className={cn(
            "flex-1 gap-1.5 transition-all text-sm px-2",
            entryType === "interest" 
              ? "bg-primary/20 text-primary hover:bg-primary/30" 
              : "hover:bg-muted-foreground/10"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Interés
        </Button>
      </div>

      {/* Currency Toggle */}
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

      {/* Amount Display */}
      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <div className="flex items-baseline gap-2">
          {currency && (
            <span className="text-2xl text-muted-foreground">{currency}</span>
          )}
          <span className={cn(
            "font-bold transition-all",
            displayAmount.length > 8 ? "text-4xl" : "text-5xl",
            !currency ? "text-muted-foreground" : getTypeColor()
          )}>
            {!currency ? "Elegí moneda" : new Intl.NumberFormat("es-AR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(parseFloat(displayAmount) || 0)}
          </span>
        </div>
        {currency && (
          <p className="text-sm text-muted-foreground mt-2">
            {entryType === "deposit" && "Ingreso a ahorros"}
            {entryType === "withdrawal" && "Retiro de ahorros"}
            {entryType === "interest" && "Interés ganado"}
          </p>
        )}
      </div>

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map((key) => (
          <Button
            key={key}
            type="button"
            variant="outline"
            onClick={() => handleKeyPress(key)}
            disabled={!currency}
            className={cn(
              "h-14 text-xl font-semibold border-border/50 hover:bg-muted",
              key === "backspace" && "text-destructive"
            )}
          >
            {key === "backspace" ? <Delete className="h-6 w-6" /> : key}
          </Button>
        ))}
      </div>

      {/* Next Button */}
      <Button 
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="w-full h-12 text-lg gradient-primary"
      >
        Continuar
      </Button>
    </div>
  );
};
