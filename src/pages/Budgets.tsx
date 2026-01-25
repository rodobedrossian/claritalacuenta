import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Target, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetsTable } from "@/components/budgets/BudgetsTable";
import { CategoriesTable } from "@/components/budgets/CategoriesTable";
import { AddBudgetDialog } from "@/components/budgets/AddBudgetDialog";
import { AddCategoryDialog } from "@/components/budgets/AddCategoryDialog";
import { BudgetsSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useBudgetsData } from "@/hooks/useBudgetsData";
import { useCategoriesData } from "@/hooks/useCategoriesData";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

const Budgets = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const {
    budgets,
    budgetsWithSpending,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useBudgetsData(user?.id, activeMonth, transactions);

  const {
    categories,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategoriesData();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });
  }, [navigate]);

  if (loading || categoriesLoading) {
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
      <div className="min-h-screen">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 md:px-6 py-4 pl-14 md:pl-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Presupuestos</h1>
              <p className="text-sm text-muted-foreground mt-1">
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
                  <p className="text-sm text-muted-foreground">Total Presupuestado</p>
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
                  <p className="text-sm text-muted-foreground">Total Gastado</p>
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
                  <p className="text-sm text-muted-foreground">En Riesgo</p>
                  <p className="text-xl font-bold">
                    {budgetsAtRisk} {budgetsAtRisk === 1 ? 'presupuesto' : 'presupuestos'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="budgets" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="budgets" className="gap-2">
                <Target className="h-4 w-4" />
                Presupuestos
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Categorías
              </TabsTrigger>
            </TabsList>

            <TabsContent value="budgets" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Presupuestos Activos</h2>
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
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Categorías</h2>
                <AddCategoryDialog onAdd={addCategory} />
              </div>
              <CategoriesTable categories={categories} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppLayout>
  );
};

export default Budgets;
