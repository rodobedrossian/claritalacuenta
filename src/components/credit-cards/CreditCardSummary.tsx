import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CreditCardType {
  id: string;
  name: string;
  bank: string | null;
  closing_day: number | null;
}

interface ProjectedByCard {
  credit_card_id: string;
  usd: number;
  ars: number;
}

interface CreditCardSummaryProps {
  creditCards: CreditCardType[];
  projectedByCard: ProjectedByCard[];
  projectedExpensesUSD: number;
  projectedExpensesARS: number;
  onReconcile: (cardId: string) => void;
}

export const CreditCardSummary = ({
  creditCards,
  projectedByCard,
  projectedExpensesUSD,
  projectedExpensesARS,
  onReconcile
}: CreditCardSummaryProps) => {
  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const getCardProjected = (cardId: string) => {
    return projectedByCard.find(p => p.credit_card_id === cardId) || { usd: 0, ars: 0 };
  };

  if (projectedExpensesUSD === 0 && projectedExpensesARS === 0) {
    return null;
  }

  return (
    <Card className="p-6 gradient-card border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Gastos Proyectados de TC</h3>
      </div>
      
      <div className="space-y-4">
        {/* Total Summary */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-sm text-muted-foreground mb-2">Total pendiente de pagar</p>
          <div className="flex gap-4">
            {projectedExpensesUSD > 0 && (
              <span className="text-xl font-bold text-warning">
                {formatCurrency(projectedExpensesUSD, "USD")}
              </span>
            )}
            {projectedExpensesARS > 0 && (
              <span className="text-xl font-bold text-warning">
                {formatCurrency(projectedExpensesARS, "ARS")}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Estos gastos se registran en tus presupuestos pero no impactan tu balance hasta que pagues el resumen
          </p>
        </div>

        {/* Per Card Breakdown */}
        {creditCards.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Por tarjeta:</p>
            {creditCards.map(card => {
              const projected = getCardProjected(card.id);
              if (projected.usd === 0 && projected.ars === 0) return null;
              
              return (
                <div 
                  key={card.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card"
                >
                  <div>
                    <p className="font-medium">{card.name}</p>
                    {card.bank && (
                      <p className="text-xs text-muted-foreground">{card.bank}</p>
                    )}
                    <div className="flex gap-2 mt-1">
                      {projected.usd > 0 && (
                        <span className="text-sm text-warning">
                          {formatCurrency(projected.usd, "USD")}
                        </span>
                      )}
                      {projected.ars > 0 && (
                        <span className="text-sm text-warning">
                          {formatCurrency(projected.ars, "ARS")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onReconcile(card.id)}
                  >
                    Reconciliar
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};
