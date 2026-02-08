import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { BudgetsTable } from "@/components/budgets/BudgetsTable";
import { AddBudgetDialog } from "@/components/budgets/AddBudgetDialog";
import { BudgetsSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useBudgetsData } from "@/hooks/useBudgetsData";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useCategoriesData } from "@/hooks/useCategoriesData";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

const Budgets = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeMonth] = useState<Date>(new Date());
  const [transactions, setTransactions] = useState<Array<{
    category: string;
    currency: string;
    amount: number;
    type: string;
  }>>([]);

  // Fetch transactions for the current month
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      
      const start = startOfMonth(activeMonth);
      const end = endOfMonth(activeMonth);
      
      const { data, error } = await supabase
        .from("transactions")
        .select("category, currency, amount, type")
        .gte("date", start.toISOString())
        .lte("date", end.toISOString())
        .eq("type", "expense")
        .eq("status", "confirmed");

      if (!error && data) {
        setTransactions(data.map(t => ({
          ...t,
          amount: typeof t.amount === "string" ? parseFloat(t.amount) : t.amount
        })));
      }
    };

    fetchTransactions();
  }, [user, activeMonth]);

  const { workspaceId } = useWorkspace(user?.id ?? null);

  const {
    budgets,
    budgetsWithSpending,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useBudgetsData(workspaceId, activeMonth, transactions);

  const { categories, loading: categoriesLoading } = useCategoriesData(user?.id ?? null);

  if (authLoading || categoriesLoading) {
    return (
      <AppLayout>
        <BudgetsSkeleton />
      </AppLayout>
    );
  }

  // Summary stats
  const totalBudgeted = budgetsWithSpending.reduce((sum, b) => sum + b.monthly_limit, 0);
  const totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0);
  const budgetsAtRisk = budgetsWithSpending.filter(b => b.percentage >= 80).length;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 pt-safe pb-3 transition-all duration-300">
          <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
            <div className="h-10 flex flex-col justify-center">
              <h1 className="text-xl font-bold tracking-tight">Presupuestos</h1>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {format(activeMonth, "MMMM yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4 gradient-card border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total presupuestado</p>
                  <p className="text-xl font-bold">
                    ARS {totalBudgeted.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 gradient-card border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Target className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total gastado</p>
                  <p className="text-xl font-bold">
                    ARS {totalSpent.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 gradient-card border-border/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${budgetsAtRisk > 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
                  <Target className={`h-5 w-5 ${budgetsAtRisk > 0 ? 'text-destructive' : 'text-success'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En riesgo</p>
                  <p className="text-xl font-bold">
                    {budgetsAtRisk} {budgetsAtRisk === 1 ? 'presupuesto' : 'presupuestos'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Presupuestos activos */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Presupuestos activos</h2>
              <AddBudgetDialog
                onAdd={addBudget}
                categories={categories}
                existingBudgets={budgets.map(b => ({ category: b.category, currency: b.currency }))}
              />
            </div>
            <BudgetsTable
              budgets={budgetsWithSpending}
              onUpdate={updateBudget}
              onDelete={deleteBudget}
            />
          </div>
        </main>
        
        {/* Spacer to clear bottom nav */}
        <div className="h-[calc(72px+env(safe-area-inset-bottom,0)+2rem)] md:hidden" />
      </div>
    </AppLayout>
  );
};

export default Budgets;
