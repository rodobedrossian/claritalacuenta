import { MonthlyProjection, Installment } from "@/hooks/useInstallmentProjection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowUp, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EndingInstallmentsListProps {
  projections: MonthlyProjection[];
}

export const EndingInstallmentsList = ({ projections }: EndingInstallmentsListProps) => {
  // Filter only months that have ending installments (next 6 months)
  const monthsWithEnding = projections
    .slice(0, 6)
    .filter(p => p.endingInstallments.length > 0);

  if (monthsWithEnding.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">
            No hay cuotas que terminen en los próximos 6 meses
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `US$${amount.toLocaleString()}`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Cuotas que Terminan Pronto
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Liberarás dinero cuando estas cuotas finalicen
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {monthsWithEnding.map((month) => {
          const totalFreedARS = month.endingInstallments
            .filter(i => i.currency === "ARS")
            .reduce((sum, i) => sum + i.amount, 0);
          
          const totalFreedUSD = month.endingInstallments
            .filter(i => i.currency === "USD")
            .reduce((sum, i) => sum + i.amount, 0);

          return (
            <div 
              key={month.month.toISOString()} 
              className="bg-muted/30 rounded-lg p-4 space-y-3"
            >
              {/* Month Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    📅 {format(month.month, "MMMM yyyy", { locale: es }).charAt(0).toUpperCase() + 
                        format(month.month, "MMMM yyyy", { locale: es }).slice(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {month.endingInstallments.length} cuota{month.endingInstallments.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Installments List */}
              <div className="space-y-2">
                {month.endingInstallments.map((installment) => (
                  <div 
                    key={installment.id}
                    className="flex items-center justify-between py-2 px-3 bg-background/50 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {installment.description.replace(/^\*\s*/, '')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cuota {installment.installmentCurrent} de {installment.installmentTotal}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground ml-3 whitespace-nowrap">
                      {formatCurrency(installment.amount, installment.currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Freed */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-sm text-muted-foreground">Total liberado:</span>
                <div className="flex items-center gap-2">
                  {totalFreedARS > 0 && (
                    <Badge className="bg-success/20 text-success hover:bg-success/30 border-0">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      ${totalFreedARS.toLocaleString()}
                    </Badge>
                  )}
                  {totalFreedUSD > 0 && (
                    <Badge className="bg-success/20 text-success hover:bg-success/30 border-0">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      US${totalFreedUSD.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
