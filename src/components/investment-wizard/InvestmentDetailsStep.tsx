import { useState, useMemo } from "react";
import { ArrowLeft, Calculator, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { InvestmentType } from "./InvestmentTypeStep";

interface InvestmentDetailsStepProps {
  investmentType: InvestmentType;
  currency: "USD" | "ARS";
  amount: string;
  name: string;
  institution: string;
  rateType: "fixed" | "variable" | "none";
  interestRate: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  notes: string;
  onNameChange: (name: string) => void;
  onInstitutionChange: (institution: string) => void;
  onRateTypeChange: (type: "fixed" | "variable" | "none") => void;
  onInterestRateChange: (rate: string) => void;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onNotesChange: (notes: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

const typeLabels: Record<InvestmentType, string> = {
  plazo_fijo: "Plazo Fijo",
  fci: "FCI",
  cedear: "CEDEAR",
  cripto: "Cripto",
  otro: "Inversión",
};

export const InvestmentDetailsStep = ({
  investmentType,
  currency,
  amount,
  name,
  institution,
  rateType,
  interestRate,
  startDate,
  endDate,
  notes,
  onNameChange,
  onInstitutionChange,
  onRateTypeChange,
  onInterestRateChange,
  onStartDateChange,
  onEndDateChange,
  onNotesChange,
  onBack,
  onSubmit,
  isSubmitting = false,
}: InvestmentDetailsStepProps) => {
  const numAmount = parseFloat(amount) || 0;
  const numRate = parseFloat(interestRate) || 0;

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate estimated return for fixed rate
  const estimatedReturn = useMemo(() => {
    if (rateType !== "fixed" || !numRate || !startDate || !endDate) return null;
    
    const days = differenceInDays(endDate, startDate);
    if (days <= 0) return null;

    // Simple interest calculation: Principal * (TNA/100) * (days/365)
    const interest = numAmount * (numRate / 100) * (days / 365);
    return {
      interest,
      total: numAmount + interest,
      days
    };
  }, [numAmount, numRate, startDate, endDate, rateType]);

  const canSubmit = name.trim().length > 0;

  // Show rate fields for relevant investment types
  const showRateFields = ["plazo_fijo", "fci"].includes(investmentType);

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="flex items-center gap-2 p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium">Detalles de la inversión</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Summary card */}
        <div className="p-4 rounded-xl bg-success/5 border border-success/20">
          <p className="text-sm text-muted-foreground">{typeLabels[investmentType]}</p>
          <p className="text-xl font-bold text-success">
            {currency} {formatAmount(numAmount)}
          </p>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label>Nombre de la inversión *</Label>
          <Input
            placeholder={`Ej: ${typeLabels[investmentType]} Banco Nación`}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        {/* Institution */}
        <div className="space-y-2">
          <Label>Institución (opcional)</Label>
          <Input
            placeholder="Ej: Banco Galicia, Binance, etc."
            value={institution}
            onChange={(e) => onInstitutionChange(e.target.value)}
          />
        </div>

        {/* Rate type and interest - only for relevant types */}
        {showRateFields && (
          <>
            <div className="space-y-2">
              <Label>Tipo de tasa</Label>
              <div className="flex gap-2">
                {(["fixed", "variable", "none"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onRateTypeChange(type)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      rateType === type
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {type === "fixed" ? "Fija (TNA)" : type === "variable" ? "Variable" : "Sin tasa"}
                  </button>
                ))}
              </div>
            </div>

            {rateType === "fixed" && (
              <div className="space-y-2">
                <Label>TNA (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 32.5"
                  value={interestRate}
                  onChange={(e) => onInterestRateChange(e.target.value)}
                />
              </div>
            )}
          </>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fecha inicio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={onStartDateChange}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Vencimiento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy", { locale: es }) : "Sin fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={onEndDateChange}
                  locale={es}
                  disabled={(date) => startDate ? date < startDate : false}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Estimated return preview */}
        {estimatedReturn && (
          <div className="p-4 rounded-xl bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">Estimación de ganancia</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plazo:</span>
                <span>{estimatedReturn.days} días</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interés estimado:</span>
                <span className="text-success font-medium">+{currency} {formatAmount(estimatedReturn.interest)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-success/20">
                <span className="font-medium">Total al vencimiento:</span>
                <span className="font-bold">{currency} {formatAmount(estimatedReturn.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notas (opcional)</Label>
          <Textarea
            placeholder="Información adicional..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={2}
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
          {isSubmitting ? "Registrando..." : "Registrar Inversión"}
        </Button>
      </div>
    </div>
  );
};
