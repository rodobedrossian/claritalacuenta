import { ChevronLeft, Wallet, Building2, HelpCircle, Check, ArrowDownCircle, ArrowUpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface SavingsDetailsStepProps {
  entryType: "deposit" | "withdrawal" | "interest";
  currency: "USD" | "ARS";
  amount: string;
  savingsType: "cash" | "bank" | "other" | "";
  notes: string;
  onSavingsTypeChange: (type: "cash" | "bank" | "other") => void;
  onNotesChange: (notes: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const SavingsDetailsStep = ({
  entryType,
  currency,
  amount,
  savingsType,
  notes,
  onSavingsTypeChange,
  onNotesChange,
  onBack,
  onSubmit,
  isSubmitting,
}: SavingsDetailsStepProps) => {
  const formattedAmount = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(parseFloat(amount) || 0);

  const getTypeInfo = () => {
    switch (entryType) {
      case "deposit":
        return { 
          label: "Depósito", 
          color: "text-success", 
          bgColor: "bg-success/10",
          icon: ArrowDownCircle,
          prefix: "+"
        };
      case "withdrawal":
        return { 
          label: "Retiro", 
          color: "text-destructive", 
          bgColor: "bg-destructive/10",
          icon: ArrowUpCircle,
          prefix: "-"
        };
      case "interest":
        return { 
          label: "Interés Ganado", 
          color: "text-primary", 
          bgColor: "bg-primary/10",
          icon: Sparkles,
          prefix: "+"
        };
    }
  };

  const typeInfo = getTypeInfo();
  const TypeIcon = typeInfo.icon;
  const canSubmit = !!savingsType;

  const savingsTypeOptions = [
    { value: "cash", label: "Efectivo", icon: Wallet, description: "Dinero en mano" },
    { value: "bank", label: "Banco", icon: Building2, description: "Cuenta bancaria" },
    { value: "other", label: "Otro", icon: HelpCircle, description: "Otro destino" },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Back */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h3 className="font-semibold text-lg">
            {entryType === "deposit" && "¿Dónde guardás?"}
            {entryType === "withdrawal" && "¿De dónde sale?"}
            {entryType === "interest" && "¿Dónde se acredita?"}
          </h3>
          <p className="text-sm text-muted-foreground">Seleccioná el tipo de ahorro</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50 mb-4">
        <div 
          className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", typeInfo.bgColor)}
        >
          <TypeIcon className={cn("h-6 w-6", typeInfo.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{typeInfo.label}</p>
          <p className="text-xs text-muted-foreground">Ahorro en {currency}</p>
        </div>
        <div className={cn("text-lg font-bold", typeInfo.color)}>
          {typeInfo.prefix}{currency} {formattedAmount}
        </div>
      </div>

      {/* Savings Type Selection */}
      <div className="space-y-2 mb-4">
        <Label>Tipo de ahorro</Label>
        <div className="grid grid-cols-3 gap-2">
          {savingsTypeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = savingsType === option.value;
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSavingsTypeChange(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isSelected 
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30" 
                    : "border-border/50 bg-card hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}>
                  <Icon className={cn(
                    "h-5 w-5",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <span className={cn(
                  "text-sm font-medium text-center",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="flex-1 space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Agregar una nota..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="bg-muted border-border resize-none"
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <Button 
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className="w-full h-12 text-lg gradient-primary mt-4"
      >
        <Check className="mr-2 h-5 w-5" />
        {isSubmitting ? "Guardando..." : "Registrar ahorro"}
      </Button>
    </div>
  );
};
