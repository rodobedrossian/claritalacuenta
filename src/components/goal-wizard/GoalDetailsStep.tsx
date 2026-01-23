import { ArrowLeft, Target, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface GoalDetailsStepProps {
  currency: "USD" | "ARS";
  amount: string;
  name: string;
  targetDate: Date | undefined;
  onNameChange: (name: string) => void;
  onTargetDateChange: (date: Date | undefined) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const GoalDetailsStep = ({
  currency,
  amount,
  name,
  targetDate,
  onNameChange,
  onTargetDateChange,
  onBack,
  onSubmit,
  isSubmitting = false,
}: GoalDetailsStepProps) => {
  const numAmount = parseFloat(amount) || 0;

  const formatAmount = () => {
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const canSubmit = name.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="flex items-center gap-2 p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium">Detalles del objetivo</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Summary card */}
        <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-secondary/20">
              <Target className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Meta de ahorro</p>
              <p className="text-xl font-bold text-secondary">
                {currency} {formatAmount()}
              </p>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label>¿Para qué estás ahorrando? *</Label>
          <Input
            placeholder="Ej: Vacaciones, Auto nuevo, Fondo de emergencia..."
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            autoFocus
          />
        </div>

        {/* Target date */}
        <div className="space-y-2">
          <Label>Fecha objetivo (opcional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {targetDate ? format(targetDate, "dd 'de' MMMM, yyyy", { locale: es }) : "Sin fecha límite"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={targetDate}
                onSelect={onTargetDateChange}
                locale={es}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            Establecer una fecha te ayuda a mantenerte motivado
          </p>
        </div>
      </div>

      {/* Submit button */}
      <div className="p-4 border-t border-border/50">
        <Button
          className="w-full h-12 text-base font-medium"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "Creando..." : "Crear Objetivo"}
        </Button>
      </div>
    </div>
  );
};
