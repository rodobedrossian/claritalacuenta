import { TrendingDown, Calendar, Wallet, CreditCard, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProjectionEmptyStateProps {
  hasCreditCards: boolean;
  hasStatements: boolean;
  onAddCard: () => void;
  onImportStatement: () => void;
}

const projectionStats = [
  {
    label: "Cuotas próximo mes",
    value: "$567K",
    icon: Calendar,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "En Mar liberás",
    value: "$138K",
    icon: Wallet,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    label: "En 6 meses baja",
    value: "-89%",
    icon: TrendingDown,
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

const monthlyProjection = [
  { month: "Ene", amount: 567, percentage: 100 },
  { month: "Feb", amount: 542, percentage: 96 },
  { month: "Mar", amount: 429, percentage: 76 },
  { month: "Abr", amount: 385, percentage: 68 },
  { month: "May", amount: 312, percentage: 55 },
  { month: "Jun", amount: 245, percentage: 43 },
];

export const ProjectionEmptyState = ({
  hasCreditCards,
  hasStatements,
  onAddCard,
  onImportStatement,
}: ProjectionEmptyStateProps) => {
  const getHeadline = () => {
    if (!hasCreditCards) {
      return "Registrá tu tarjeta para empezar";
    }
    if (!hasStatements) {
      return "Importá un resumen para ver tu proyección";
    }
    return "Tus resúmenes no tienen cuotas pendientes";
  };

  const getDescription = () => {
    if (!hasCreditCards) {
      return "Agregá tu tarjeta de crédito y luego importá los resúmenes para ver cómo evoluciona tu compromiso mensual en cuotas.";
    }
    if (!hasStatements) {
      return "Al importar tu resumen podés ver cuánto pagás en cuotas cada mes, cuándo se libera dinero y cómo baja tu compromiso.";
    }
    return "Importá más resúmenes con cuotas para ver la proyección de tu compromiso mensual.";
  };

  const primaryCta = !hasCreditCards
    ? { label: "Agregar mi primera tarjeta", onClick: onAddCard, Icon: CreditCard }
    : { label: hasStatements ? "Importar otro resumen" : "Importar resumen", onClick: onImportStatement, Icon: Upload };
  const PrimaryIcon = primaryCta.Icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <div className="inline-flex p-2 rounded-xl bg-success/10 mb-4">
          <TrendingDown className="h-6 w-6 text-success" />
        </div>
        <h2 className="text-xl font-bold">Proyección de Cuotas</h2>
        <p className="text-muted-foreground mt-1">{getHeadline()}</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">{getDescription()}</p>
      </div>

      {/* Sneak peek - what you'll see */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Así se vería tu proyección</p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {projectionStats.map((stat) => (
            <Card key={stat.label} className="bg-card/50 border-border/50">
              <CardContent className="p-3 sm:p-4">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${stat.bgColor} flex items-center justify-center mb-1.5 sm:mb-2`}
                >
                  <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color}`} />
                </div>
                <p className="text-base sm:text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mini chart preview */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-success" />
              Evolución mensual
            </h4>
            <div className="space-y-2">
              {monthlyProjection.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8 shrink-0">{m.month}</span>
                  <div className="flex-1 h-5 bg-muted/50 rounded-md overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-md flex items-center justify-end pr-1.5 min-w-[2ch]"
                      style={{ width: `${m.percentage}%` }}
                    >
                      <span className="text-[9px] font-medium text-white">${m.amount}K</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button onClick={primaryCta.onClick} className="w-full sm:w-auto gap-2" size="lg">
          <PrimaryIcon className="h-4 w-4" />
          {primaryCta.label}
        </Button>
        {hasCreditCards && !hasStatements && (
          <Button variant="outline" onClick={onAddCard} className="w-full sm:w-auto gap-2" size="lg">
            <CreditCard className="h-4 w-4" />
            Agregar otra tarjeta
          </Button>
        )}
        {!hasCreditCards && (
          <Button
            variant="outline"
            onClick={onImportStatement}
            className="w-full sm:w-auto gap-2"
            size="lg"
          >
            <Upload className="h-4 w-4" />
            Importar resumen
          </Button>
        )}
      </div>
    </div>
  );
};
