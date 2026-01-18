import { useInstallmentProjection } from "@/hooks/useInstallmentProjection";
import { InstallmentProjectionChart } from "./InstallmentProjectionChart";
import { EndingInstallmentsList } from "./EndingInstallmentsList";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Wallet, Calendar, CreditCard, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InstallmentProjectionPanelProps {
  userId: string;
}

export const InstallmentProjectionPanel = ({ userId }: InstallmentProjectionPanelProps) => {
  const { projections, summary, activeInstallments, loading, error } = useInstallmentProjection(userId);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Calculando proyecciones...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="py-6 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  // Don't show panel if no active installments
  if (activeInstallments.length === 0) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${Math.round(amount / 1000)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Find next month with freed money
  const nextMonthWithFreed = projections.find(p => p.freedAmountARS > 0 || p.freedAmountUSD > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-success/10">
          <TrendingDown className="h-6 w-6 text-success" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Proyección de Cuotas</h2>
          <p className="text-muted-foreground text-sm">
            Visualizá cómo disminuye tu compromiso mensual
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Next Month Total */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Compromiso del próximo mes</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.nextMonthTotalARS)}</p>
                {summary.nextMonthTotalUSD > 0 && (
                  <p className="text-sm text-muted-foreground">
                    + US${summary.nextMonthTotalUSD.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {summary.totalActiveInstallments} cuotas activas
            </p>
          </CardContent>
        </Card>

        {/* Next Month Freed */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {nextMonthWithFreed ? (
                    <>En {nextMonthWithFreed.monthLabel} liberás</>
                  ) : (
                    "Próxima liberación"
                  )}
                </p>
                {nextMonthWithFreed ? (
                  <>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(nextMonthWithFreed.freedAmountARS)}
                    </p>
                    {nextMonthWithFreed.freedAmountUSD > 0 && (
                      <p className="text-sm text-success">
                        + US${nextMonthWithFreed.freedAmountUSD.toLocaleString()}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xl font-medium text-muted-foreground">Sin cambios próximos</p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <Wallet className="h-5 w-5 text-success" />
              </div>
            </div>
            {nextMonthWithFreed && nextMonthWithFreed.endingInstallments.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {nextMonthWithFreed.endingInstallments.length} cuota{nextMonthWithFreed.endingInstallments.length > 1 ? 's' : ''} termina{nextMonthWithFreed.endingInstallments.length > 1 ? 'n' : ''}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 6 Month Reduction */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">En 6 meses baja</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{formatCurrency(summary.sixMonthReductionARS)}</p>
                  {summary.sixMonthReductionPercent > 0 && (
                    <Badge className="bg-success/20 text-success hover:bg-success/30 border-0">
                      -{summary.sixMonthReductionPercent}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-secondary/10">
                <Calendar className="h-5 w-5 text-secondary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Reducción proyectada de cuotas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart - Full Width */}
      <InstallmentProjectionChart projections={projections} />
      
      {/* Ending Installments List */}
      <EndingInstallmentsList projections={projections} />
    </div>
  );
};
