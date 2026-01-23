import { TrendingUp, TrendingDown, PiggyBank, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickStatsProps {
  income: { usd: number; ars: number; total: number };
  expenses: { usd: number; ars: number; total: number };
  savings: { usd: number; ars: number };
  formatCurrency: (amount: number, currency: "USD" | "ARS") => string;
}

export const QuickStats = ({
  income,
  expenses,
  savings,
  formatCurrency,
}: QuickStatsProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {/* Income Card */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ingresos del mes</p>
              <p className="text-lg font-bold text-success">
                {formatCurrency(income.total, "ARS")}
              </p>
            </div>
          </div>
          <div className="text-right space-y-0.5">
            {income.usd > 0 && (
              <p className="text-xs text-muted-foreground">
                USD {income.usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            )}
            {income.ars > 0 && (
              <p className="text-xs text-muted-foreground">
                ARS {income.ars.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Expenses Card */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gastos del mes</p>
              <p className="text-lg font-bold text-destructive">
                {formatCurrency(expenses.total, "ARS")}
              </p>
            </div>
          </div>
          <div className="text-right space-y-0.5">
            {expenses.usd > 0 && (
              <p className="text-xs text-muted-foreground">
                USD {expenses.usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            )}
            {expenses.ars > 0 && (
              <p className="text-xs text-muted-foreground">
                ARS {expenses.ars.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Savings Card */}
      <button 
        onClick={() => navigate("/savings")}
        className="w-full bg-card rounded-xl p-4 border border-border/50 hover:border-primary/50 transition-colors text-left group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <PiggyBank className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ahorros actuales</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(savings.usd, "USD")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              {savings.ars > 0 && (
                <p className="text-xs text-muted-foreground">
                  + {formatCurrency(savings.ars, "ARS")}
                </p>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </button>
    </div>
  );
};
