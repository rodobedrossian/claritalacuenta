import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddRecurringExpenseDialog } from "@/components/recurring/AddRecurringExpenseDialog";
import { RecurringExpensesList } from "@/components/recurring/RecurringExpensesList";
import { useRecurringExpensesData } from "@/hooks/useRecurringExpensesData";
import { useCategoriesData } from "@/hooks/useCategoriesData";
import { Repeat } from "lucide-react";

export default function Recurrentes() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { categories, loading: categoriesLoading } = useCategoriesData(userId);
  const {
    recurringExpenses,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    generateTransaction,
  } = useRecurringExpensesData(userId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading || categoriesLoading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 pt-safe pb-3 transition-all duration-300">
          <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
            <div className="h-10 flex items-center">
              <h1 className="text-xl font-bold tracking-tight">Gastos recurrentes</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Repeat className="h-5 w-5" />
                    Gastos recurrentes
                  </CardTitle>
                  <CardDescription>
                    Configurá gastos que se repiten todos los meses
                  </CardDescription>
                </div>
                <AddRecurringExpenseDialog categories={categories} onAdd={addRecurringExpense} />
              </div>
            </CardHeader>
            <CardContent>
              <RecurringExpensesList
                expenses={recurringExpenses}
                categories={categories}
                onDelete={deleteRecurringExpense}
                onUpdate={updateRecurringExpense}
                onGenerate={generateTransaction}
              />
            </CardContent>
          </Card>
        </main>

        <div className="h-[calc(72px+env(safe-area-inset-bottom,0)+2rem)] md:hidden" />
      </div>
    </AppLayout>
  );
}
