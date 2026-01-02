import { format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Building2, TrendingUp, Calendar, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Investment } from "@/pages/Savings";

interface InvestmentsListProps {
  investments: Investment[];
  onDelete: (id: string) => void;
  exchangeRate: number;
}

const investmentTypeLabels: Record<Investment["investment_type"], string> = {
  plazo_fijo: "Plazo Fijo",
  fci: "FCI",
  cedear: "CEDEAR",
  cripto: "Cripto",
  otro: "Otro",
};

export const InvestmentsList = ({ investments, onDelete, exchangeRate }: InvestmentsListProps) => {
  const formatCurrency = (amount: number, currency: "USD" | "ARS") => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const calculateEstimatedReturn = (investment: Investment) => {
    if (investment.rate_type !== "fixed" || !investment.interest_rate || !investment.end_date) {
      return null;
    }
    
    const startDate = parseISO(investment.start_date);
    const endDate = parseISO(investment.end_date);
    const days = differenceInDays(endDate, startDate);
    
    // Simple interest: principal * (1 + TNA * days / 365)
    const estimatedAmount = investment.principal_amount * (1 + (investment.interest_rate / 100) * (days / 365));
    const profit = estimatedAmount - investment.principal_amount;
    
    return { estimatedAmount, profit, days };
  };

  const getTimeProgress = (investment: Investment) => {
    if (!investment.end_date) return null;
    
    const startDate = parseISO(investment.start_date);
    const endDate = parseISO(investment.end_date);
    const today = new Date();
    
    const totalDays = differenceInDays(endDate, startDate);
    const elapsedDays = differenceInDays(today, startDate);
    const remainingDays = differenceInDays(endDate, today);
    
    const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    
    return { progress, remainingDays, totalDays };
  };

  if (investments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay inversiones registradas</p>
          <p className="text-sm text-muted-foreground mt-2">
            Usa el botón "Inversión" para agregar una nueva inversión
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {investments.map((investment) => {
        const estimatedReturn = calculateEstimatedReturn(investment);
        const timeProgress = getTimeProgress(investment);
        
        return (
          <Card key={investment.id} className={!investment.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{investment.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      {investmentTypeLabels[investment.investment_type]}
                    </Badge>
                    {!investment.is_active && (
                      <Badge variant="secondary">Finalizada</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(investment.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Principal and Current Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Capital</p>
                  <p className="font-semibold">
                    {formatCurrency(investment.principal_amount, investment.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monto Actual</p>
                  <p className="font-semibold">
                    {formatCurrency(investment.current_amount, investment.currency)}
                  </p>
                </div>
              </div>

              {/* Institution and Rate */}
              <div className="flex flex-wrap gap-3 text-sm">
                {investment.institution && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {investment.institution}
                  </div>
                )}
                {investment.interest_rate && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Percent className="h-4 w-4" />
                    TNA {investment.interest_rate}%
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(parseISO(investment.start_date), "d MMM yyyy", { locale: es })}
                  {investment.end_date && (
                    <> → {format(parseISO(investment.end_date), "d MMM yyyy", { locale: es })}</>
                  )}
                </span>
              </div>

              {/* Time Progress for fixed-term investments */}
              {timeProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="text-muted-foreground">
                      {timeProgress.remainingDays > 0 
                        ? `${timeProgress.remainingDays} días restantes`
                        : "Vencido"
                      }
                    </span>
                  </div>
                  <Progress value={timeProgress.progress} className="h-2" />
                </div>
              )}

              {/* Estimated Return */}
              {estimatedReturn && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Estimado al vencimiento ({estimatedReturn.days} días)
                      </p>
                      <p className="font-semibold text-success">
                        {formatCurrency(estimatedReturn.estimatedAmount, investment.currency)}
                        <span className="text-sm font-normal ml-2">
                          (+{formatCurrency(estimatedReturn.profit, investment.currency)})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {investment.notes && (
                <p className="text-sm text-muted-foreground pt-2 border-t border-border">
                  {investment.notes}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};