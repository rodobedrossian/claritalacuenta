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

  // Helper to format breakdown line
  const formatBreakdown = (usd: number, ars: number) => {
    const parts: string[] = [];
    if (usd > 0) parts.push(`USD ${usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
    if (ars > 0) parts.push(`ARS ${ars.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
    return parts.join(' · ');
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Income */}
      <div className="bg-card rounded-xl p-3 border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-success/10">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          </div>
          <span className="text-xs text-muted-foreground">Ingresos</span>
        </div>
        <p className="text-sm font-semibold text-success">
          {formatCurrency(income.total, "ARS")}
        </p>
        {(income.usd > 0 || income.ars > 0) && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {formatBreakdown(income.usd, income.ars)}
          </p>
        )}
      </div>

      {/* Expenses */}
      <div className="bg-card rounded-xl p-3 border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-destructive/10">
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          </div>
          <span className="text-xs text-muted-foreground">Gastos</span>
        </div>
        <p className="text-sm font-semibold text-destructive">
          {formatCurrency(expenses.total, "ARS")}
        </p>
        {(expenses.usd > 0 || expenses.ars > 0) && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {formatBreakdown(expenses.usd, expenses.ars)}
          </p>
        )}
      </div>

      {/* Savings */}
      <button 
        onClick={() => navigate("/savings")}
        className="bg-card rounded-xl p-3 border border-border/50 hover:border-primary/50 transition-colors text-left group"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <PiggyBank className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">Ahorros</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">
              {formatCurrency(savings.usd, "USD")}
            </p>
            {savings.ars > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatCurrency(savings.ars, "ARS")}
              </p>
            )}
          </div>
          <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </button>
    </div>
  );
};
