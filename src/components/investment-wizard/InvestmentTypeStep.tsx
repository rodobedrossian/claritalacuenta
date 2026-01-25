import { Landmark, TrendingUp, BarChart3, Bitcoin, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type InvestmentType = "plazo_fijo" | "fci" | "cedear" | "cripto" | "otro";

interface InvestmentTypeStepProps {
  selectedType: InvestmentType | "";
  onTypeChange: (type: InvestmentType) => void;
  onNext: () => void;
}

const investmentTypes = [
  { 
    value: "plazo_fijo" as const, 
    label: "Plazo Fijo", 
    icon: Landmark, 
    description: "Depósito bancario a término",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  { 
    value: "fci" as const, 
    label: "FCI", 
    icon: BarChart3, 
    description: "Fondo Común de Inversión",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  { 
    value: "cedear" as const, 
    label: "CEDEAR", 
    icon: TrendingUp, 
    description: "Acciones extranjeras",
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  { 
    value: "cripto" as const, 
    label: "Cripto", 
    icon: Bitcoin, 
    description: "Criptomonedas",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10"
  },
  { 
    value: "otro" as const, 
    label: "Otro", 
    icon: HelpCircle, 
    description: "Otra inversión",
    color: "text-muted-foreground",
    bgColor: "bg-muted"
  },
];

export const InvestmentTypeStep = ({
  selectedType,
  onTypeChange,
  onNext,
}: InvestmentTypeStepProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold text-center">Nueva Inversión</h2>
        <p className="text-sm text-muted-foreground text-center mt-1">¿Qué tipo de inversión es?</p>
      </div>

      {/* Type selection */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-3">
          {investmentTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onTypeChange(type.value)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedType === type.value
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  selectedType === type.value ? "bg-primary/20" : type.bgColor
                }`}>
                  <type.icon className={`h-6 w-6 ${
                    selectedType === type.value ? "text-primary" : type.color
                  }`} />
                </div>
                <div>
                  <p className="font-medium">{type.label}</p>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Continue button */}
      <div className="p-4 border-t border-border/50">
        <Button
          className="w-full h-12 text-base font-medium"
          onClick={onNext}
          disabled={!selectedType}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
