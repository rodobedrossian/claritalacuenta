import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RecurringExpense {
  id: string;
  user_id: string;
  description: string;
  default_amount: number;
  currency: "USD" | "ARS";
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UseRecurringExpensesDataReturn {
  recurringExpenses: RecurringExpense[];
  loading: boolean;
  refetch: () => Promise<void>;
  addRecurringExpense: (expense: Omit<RecurringExpense, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
  updateRecurringExpense: (id: string, expense: Partial<RecurringExpense>) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
  generateTransaction: (expense: RecurringExpense, amount?: number) => Promise<void>;
}

export const useRecurringExpensesData = (userId: string | null, workspaceId: string | null): UseRecurringExpensesDataReturn => {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecurringExpenses = useCallback(async () => {
    if (!userId || !workspaceId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select("*")
        .order("description");

      if (error) throw error;

      setRecurringExpenses(
        (data || []).map((e) => ({
          ...e,
          default_amount: Number(e.default_amount),
          currency: e.currency as "USD" | "ARS",
        }))
      );
    } catch (error) {
      console.error("Error fetching recurring expenses:", error);
      toast.error("Error al cargar gastos recurrentes");
    } finally {
      setLoading(false);
    }
  }, [userId, workspaceId]);

  useEffect(() => {
    fetchRecurringExpenses();
  }, [fetchRecurringExpenses]);

  const addRecurringExpense = async (
    expense: Omit<RecurringExpense, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    if (!userId || !workspaceId) {
      toast.error("Debes iniciar sesión");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .insert([{ ...expense, user_id: userId, workspace_id: workspaceId }])
        .select()
        .single();

      if (error) throw error;

      setRecurringExpenses((prev) => [
        ...prev,
        {
          ...data,
          default_amount: Number(data.default_amount),
          currency: data.currency as "USD" | "ARS",
        },
      ]);
      toast.success("Gasto recurrente creado");
    } catch (error: any) {
      console.error("Error adding recurring expense:", error);
      toast.error("Error al crear gasto recurrente");
    }
  };

  const updateRecurringExpense = async (id: string, expense: Partial<RecurringExpense>) => {
    try {
      const { error } = await supabase
        .from("recurring_expenses")
        .update(expense)
        .eq("id", id);

      if (error) throw error;

      setRecurringExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...expense } : e))
      );
      toast.success("Gasto recurrente actualizado");
    } catch (error) {
      console.error("Error updating recurring expense:", error);
      toast.error("Error al actualizar gasto recurrente");
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from("recurring_expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setRecurringExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Gasto recurrente eliminado");
    } catch (error) {
      console.error("Error deleting recurring expense:", error);
      toast.error("Error al eliminar gasto recurrente");
    }
  };

  const generateTransaction = async (expense: RecurringExpense, amount?: number) => {
    if (!userId) {
      toast.error("Debes iniciar sesión");
      return;
    }

    try {
      const finalAmount = amount ?? expense.default_amount;

      const { error } = await supabase.from("transactions").insert([
        {
          user_id: expense.user_id,
          type: "expense",
          amount: finalAmount,
          currency: expense.currency,
          category: expense.category,
          description: expense.description,
          date: new Date().toISOString(),
          payment_method: "cash",
          status: "confirmed",
          source: "recurring",
        },
      ]);

      if (error) throw error;

      toast.success(`Gasto "${expense.description}" registrado: ${expense.currency} ${finalAmount.toLocaleString()}`);
    } catch (error) {
      console.error("Error generating transaction:", error);
      toast.error("Error al generar transacción");
    }
  };

  return {
    recurringExpenses,
    loading,
    refetch: fetchRecurringExpenses,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    generateTransaction,
  };
};
