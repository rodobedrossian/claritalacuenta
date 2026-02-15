import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithSpending extends Budget {
  spent: number;
  percentage: number;
}

interface UseBudgetsDataReturn {
  budgets: Budget[];
  budgetsWithSpending: BudgetWithSpending[];
  loading: boolean;
  refetch: () => Promise<void>;
  addBudget: (budget: Omit<Budget, "id" | "user_id" | "created_at" | "updated_at" | "is_active">) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

export const useBudgetsData = (
  workspaceId: string | null,
  activeMonth: Date,
  transactions: Array<{ category: string; currency: string; amount: number; type: string }>
): UseBudgetsDataReturn => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    if (!workspaceId) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("is_active", true);

      if (error) throw error;
      
      // Type assertion since types.ts may not be updated yet
      setBudgets((data as Budget[]) || []);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast.error("Error al cargar presupuestos");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Calculate spending for each budget based on current month transactions
  const budgetsWithSpending: BudgetWithSpending[] = budgets.map((budget) => {
    const spent = transactions
      .filter(
        (t) =>
          t.category === budget.category &&
          t.currency === budget.currency &&
          t.type === "expense"
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const percentage = budget.monthly_limit > 0 ? (spent / budget.monthly_limit) * 100 : 0;

    return {
      ...budget,
      spent,
      percentage: Math.min(percentage, 100),
    };
  });

  const addBudget = async (
    budget: Omit<Budget, "id" | "user_id" | "created_at" | "updated_at" | "is_active" | "workspace_id">
  ) => {
    if (!workspaceId || !user?.id) return;
    const userId = user.id;

    try {
      const { data, error } = await supabase
        .from("budgets")
        .insert([{ ...budget, user_id: userId, workspace_id: workspaceId }])
        .select()
        .single();

      if (error) throw error;

      setBudgets((prev) => [...prev, data as Budget]);
      toast.success("Presupuesto creado");
    } catch (error: any) {
      console.error("Error adding budget:", error);
      if (error.code === "23505") {
        toast.error("Ya existe un presupuesto para esta categoría y moneda");
      } else {
        toast.error("Error al crear presupuesto");
      }
    }
  };

  const updateBudget = async (id: string, budget: Partial<Budget>) => {
    try {
      const { error } = await supabase
        .from("budgets")
        .update(budget)
        .eq("id", id);

      if (error) throw error;

      setBudgets((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...budget } : b))
      );
      toast.success("Presupuesto actualizado");
    } catch (error) {
      console.error("Error updating budget:", error);
      toast.error("Error al actualizar presupuesto");
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase.from("budgets").delete().eq("id", id);

      if (error) throw error;

      setBudgets((prev) => prev.filter((b) => b.id !== id));
      toast.success("Presupuesto eliminado");
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.error("Error al eliminar presupuesto");
    }
  };

  return {
    budgets,
    budgetsWithSpending,
    loading,
    refetch: fetchBudgets,
    addBudget,
    updateBudget,
    deleteBudget,
  };
};
