import { ArrowLeft, Banknote, Building2, Wallet, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SavingsSource } from "./SavingsAmountStep";

interface SavingsDetailsStepProps {
  source: SavingsSource;
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
  source,
  currency,
  amount,
  savingsType,
  notes,
  onSavingsTypeChange,
  onNotesChange,
  onBack,
  onSubmit,
  isSubmitting = false,
}: SavingsDetailsStepProps) => {
  const numAmount = parseFloat(amount) || 0;

  const formatAmount = () => {
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const canSubmit = !!savingsType;

  const savingsTypeOptions = [
    { value: "cash" as const, label: "Efectivo", icon: Wallet, description: "Guardado en casa" },
    { value: "bank" as const, label: "Banco", icon: Building2, description: "Cuenta bancaria" },
    { value: "other" as const, label: "Otro", icon: Banknote, description: "Otro lugar" },
  ];

  const getSourceLabel = () => {
    return source === "balance" ? "Desde balance del mes" : "Ahorro existente";
  };

  const getSourceIcon = () => {
    return source === "balance" ? Banknote : PiggyBank;
  };

  const SourceIcon = getSourceIcon();

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="flex items-center gap-2 p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium">¿Dónde lo guardás?</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Summary card */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <SourceIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{getSourceLabel()}</p>
              <p className="text-xl font-bold text-primary">
                +{currency} {formatAmount()}
              </p>
            </div>
          </div>
        </div>

        {/* Savings type selector */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Tipo de ahorro</p>
          <div className="grid grid-cols-3 gap-3">
            {savingsTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onSavingsTypeChange(option.value)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  savingsType === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                <div className={`p-2 rounded-full ${
                  savingsType === option.value ? "bg-primary/20" : "bg-muted"
                }`}>
                  <option.icon className={`h-5 w-5 ${
                    savingsType === option.value ? "text-primary" : "text-muted-foreground"
                  }`} />
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Notas (opcional)</p>
          <Textarea
            placeholder="Descripción del ahorro..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* Submit button */}
      <div className="p-4 border-t border-border/50">
        <Button
          className="w-full h-12 text-base font-medium"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "Registrando..." : "Registrar Ahorro"}
        </Button>
      </div>
    </div>
  );
};
