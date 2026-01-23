import { useState } from "react";
import { ChevronLeft, CalendarIcon, Wallet, Banknote, Check } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getCategoryIcon, getCategoryColor, DEFAULT_CATEGORY_ICONS, DEFAULT_CATEGORY_COLORS } from "@/lib/categoryIcons";

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
  color?: string | null;
}

interface DetailsStepProps {
  type: "income" | "expense";
  currency: "USD" | "ARS";
  amount: string;
  category: string;
  categories: Category[];
  description: string;
  date: Date;
  paymentMethod: "cash" | "debit";
  fromSavings: boolean;
  savingsSource: "cash" | "bank" | "other" | "";
  availableSavings: number;
  onDescriptionChange: (description: string) => void;
  onDateChange: (date: Date) => void;
  onPaymentMethodChange: (method: "cash" | "debit") => void;
  onFromSavingsChange: (fromSavings: boolean) => void;
  onSavingsSourceChange: (source: "cash" | "bank" | "other") => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const DetailsStep = ({
  type,
  currency,
  amount,
  category,
  categories,
  description,
  date,
  paymentMethod,
  fromSavings,
  savingsSource,
  availableSavings,
  onDescriptionChange,
  onDateChange,
  onPaymentMethodChange,
  onFromSavingsChange,
  onSavingsSourceChange,
  onBack,
  onSubmit,
  isSubmitting,
}: DetailsStepProps) => {
  // Get category info for display
  const categoryData = categories.find(c => c.name === category);
  const iconName = categoryData?.icon || DEFAULT_CATEGORY_ICONS[category] || "circle";
  const color = categoryData?.color || DEFAULT_CATEGORY_COLORS[category] || getCategoryColor(category);
  const IconComponent = getCategoryIcon(iconName);

  const formattedAmount = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(parseFloat(amount) || 0);

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
          <h3 className="font-semibold text-lg">Detalles</h3>
          <p className="text-sm text-muted-foreground">Información adicional (opcional)</p>
        </div>
      </div>

      {/* Transaction Summary Card */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50 mb-4">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <IconComponent className="h-6 w-6" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{category}</p>
          <p className="text-xs text-muted-foreground">
            {type === "income" ? "Ingreso" : "Gasto"}
          </p>
        </div>
        <div className={cn(
          "text-lg font-bold",
          type === "income" ? "text-success" : "text-destructive"
        )}>
          {type === "income" ? "+" : "-"}{currency} {formattedAmount}
        </div>
      </div>

      {/* Form Fields */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Input
            id="description"
            placeholder="¿Para qué fue? (opcional)"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="bg-muted border-border"
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal bg-muted border-border"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && onDateChange(newDate)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Payment Method - only for expenses */}
        {type === "expense" && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Método de pago
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onPaymentMethodChange("cash")}
                className={cn(
                  "flex-1 h-10",
                  paymentMethod === "cash" 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-border/50"
                )}
              >
                Efectivo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onPaymentMethodChange("debit")}
                className={cn(
                  "flex-1 h-10",
                  paymentMethod === "debit" 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-border/50"
                )}
              >
                Débito
              </Button>
            </div>
          </div>
        )}

        {/* From Savings Option - only for expenses */}
        {type === "expense" && (
          <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="fromSavings"
                checked={fromSavings}
                onChange={(e) => onFromSavingsChange(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="fromSavings" className="flex items-center gap-2 cursor-pointer">
                <Wallet className="h-4 w-4" />
                Sale de mis ahorros
              </Label>
            </div>
            
            {fromSavings && (
              <>
                <div className="text-xs text-muted-foreground">
                  Disponible: {currency} {availableSavings.toLocaleString()}
                </div>
                <div className="space-y-2">
                  <Label>Tipo de ahorro</Label>
                  <Select 
                    value={savingsSource} 
                    onValueChange={(value: "cash" | "bank" | "other") => onSavingsSourceChange(value)}
                  >
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="bank">Banco</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button 
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full h-12 text-lg gradient-primary mt-4"
      >
        <Check className="mr-2 h-5 w-5" />
        {isSubmitting ? "Guardando..." : "Guardar transacción"}
      </Button>
    </div>
  );
};
