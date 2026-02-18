import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

import { AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { BudgetWithSpending } from "@/hooks/useBudgetsData";
import { motion } from "framer-motion";
import { getIconForCategory, getCategoryColor } from "@/lib/categoryIcons";

interface BudgetProgressProps {
  budgets: BudgetWithSpending[];
  projectedExpensesUSD?: number;
  projectedExpensesARS?: number;
  onManageBudgets?: () => void;
}

export const BudgetProgress = ({ budgets, projectedExpensesUSD = 0, projectedExpensesARS = 0, onManageBudgets }: BudgetProgressProps) => {
  const alertedBudgetsRef = useRef<Set<string>>(new Set());

  // Show alerts when reaching thresholds
  useEffect(() => {
    budgets.forEach((budget) => {
      const key80 = `${budget.id}-80`;
      const key100 = `${budget.id}-100`;

      if (budget.percentage >= 100 && !alertedBudgetsRef.current.has(key100)) {
        alertedBudgetsRef.current.add(key100);
        toast.error(
          `¡Presupuesto agotado! Has superado el límite de ${budget.category} (${budget.currency})`,
          {
            duration: 6000,
            icon: <XCircle className="h-5 w-5 text-destructive" />,
          }
        );
      } else if (
        budget.percentage >= 80 &&
        budget.percentage < 100 &&
        !alertedBudgetsRef.current.has(key80)
      ) {
        alertedBudgetsRef.current.add(key80);
        toast.warning(
          `¡Alerta! Has alcanzado el 80% del presupuesto de ${budget.category} (${budget.currency})`,
          {
            duration: 5000,
            icon: <AlertTriangle className="h-5 w-5 text-warning" />,
          }
        );
      }
    });
  }, [budgets]);

  if (budgets.length === 0) {
    return null;
  }

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 80) return "bg-warning";
    return "bg-primary";
  };

  const getStatusIcon = (percentage: number, categoryName: string) => {
    if (percentage >= 100) return <XCircle className="h-4 w-4 text-destructive" />;
    if (percentage >= 80) return <AlertTriangle className="h-4 w-4 text-warning" />;
    const IconComponent = getIconForCategory(categoryName);
    const color = getCategoryColor(categoryName);
    return <IconComponent className="h-4 w-4" style={{ color }} />;
  };

  const hasProjectedExpenses = projectedExpensesUSD > 0 || projectedExpensesARS > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <Card className="p-6 bg-card border-border/30 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Presupuestos del Mes</h3>
            {hasProjectedExpenses && (
              <p className="text-xs text-muted-foreground mt-1">
                Incluye gastos proyectados de TC
              </p>
            )}
          </div>
          {onManageBudgets && (
            <button
              onClick={onManageBudgets}
              className="text-sm text-primary hover:underline"
            >
              Gestionar
            </button>
          )}
        </div>
        <div className="space-y-5">
          {budgets.map((budget, index) => (
            <motion.div 
              key={budget.id} 
              className="space-y-2.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.08 }}
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {getStatusIcon(budget.percentage, budget.category)}
                  <span className="font-medium">{budget.category}</span>
                  <span className="text-muted-foreground text-xs">
                    ({budget.currency})
                  </span>
                </div>
                <span className="text-sm font-medium">
                  Disp: {formatCurrency(
                    Math.max(0, budget.monthly_limit - budget.spent),
                    budget.currency
                  )}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${getProgressColor(budget.percentage)} transition-all`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{budget.percentage.toFixed(0)}% usado</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};
