import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { BudgetsTable } from "@/components/budgets/BudgetsTable";
import { AddBudgetWizard } from "@/components/budgets/AddBudgetWizard";
import { BudgetsSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useBudgetsData } from "@/hooks/useBudgetsData";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useCategoriesData } from "@/hooks/useCategoriesData";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

const Budgets = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeMonth] = useState<Date>(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState<Array<{
    category: string;
    currency: string;
    amount: number;
    type: string;
  }>>([]);

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

  const totalBudgeted = budgetsWithSpending.reduce((sum, b) => sum + b.monthly_limit, 0);
  const totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0);
  const budgetsAtRisk = budgetsWithSpending.filter(b => b.percentage >= 80).length;

  const formatCompact = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[hsl(152,55%,28%)] to-[hsl(165,50%,22%)] rounded-b-3xl px-5 pt-safe pb-6 relative overflow-hidden"
        >
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

          <div className="relative z-10 pt-12 md:pt-4">
            {/* Title row */}
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-xl font-bold text-white tracking-tight">Presupuestos</h1>
              <button
                onClick={() => setAddDialogOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/30 text-white/90 text-xs font-medium hover:bg-white/10 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </button>
            </div>
            <p className="text-[11px] text-white/60 font-medium uppercase tracking-wider mb-5">
              {format(activeMonth, "MMMM yyyy", { locale: es })}
            </p>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-3 text-center">
                <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider mb-1">Presupuestado</p>
                <p className="text-base font-bold text-white">{formatCompact(totalBudgeted)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-3 text-center">
                <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider mb-1">Gastado</p>
                <p className="text-base font-bold text-white">{formatCompact(totalSpent)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-3 text-center">
                <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider mb-1">En riesgo</p>
                <p className={`text-base font-bold ${budgetsAtRisk > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                  {budgetsAtRisk}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Budget list */}
        <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Presupuestos activos</h2>
            <BudgetsTable
              budgets={budgetsWithSpending}
              onUpdate={updateBudget}
              onDelete={deleteBudget}
            />
          </div>
        </main>

        <div className="h-[calc(72px+env(safe-area-inset-bottom,0)+2rem)] md:hidden" />
      </div>

      <AddBudgetWizard
        onAdd={addBudget}
        categories={categories}
        existingBudgets={budgets.map(b => ({ category: b.category, currency: b.currency }))}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </AppLayout>
  );
};

export default Budgets;
