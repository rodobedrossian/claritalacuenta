import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { triggerNotificationHaptic } from "@/lib/haptics";
import { NotificationType } from "@capacitor/haptics";

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: "USD" | "ARS";
  category: string;
  categoryName?: string;
  description: string;
  date: string;
  user_id: string;
  from_savings?: boolean;
  savings_source?: string | null;
  payment_method?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string | null;
  closing_day: number | null;
}

export interface DashboardData {
  totals: {
    incomeUSD: number;
    incomeARS: number;
    expensesUSD: number;
    expensesARS: number;
    savingsTransfersUSD: number;
    savingsTransfersARS: number;
  };
  currentSavings: {
    usd: number;
    ars: number;
  };
  totalInvested: {
    usd: number;
    ars: number;
  };
  exchangeRate: {
    rate: number;
    updatedAt: string | null;
  };
  transactions: Transaction[];
  spendingByCategory: Array<{ category: string; amount: number }>;
  categories: Array<{ id: string; name: string; type: string }>;
  users: Array<{ id: string; full_name: string | null }>;
  creditCards: CreditCard[];
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Local state update functions for optimistic updates
  updateTransaction: (id: string, transaction: Omit<Transaction, "id">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateCurrentSavings: (savings: { usd: number; ars: number }) => void;
  updateSavingsTransfers: (currency: "USD" | "ARS", amount: number) => void;
}

export function useDashboardData(activeMonth: Date, userId: string | null, workspaceId: string | null): UseDashboardDataReturn {
  const queryClient = useQueryClient();
  const monthStr = format(activeMonth, "yyyy-MM");

  const { 
    data, 
    isLoading: loading, 
    isFetching,
    error: queryError,
    refetch: queryRefetch 
  } = useQuery({
    queryKey: ["dashboard-data", monthStr, userId, workspaceId],
    queryFn: async () => {
      if (!userId) return null;

      const { data: responseData, error: functionError } = await supabase.functions.invoke(
        "get-dashboard-data",
        {
          body: { month: monthStr }
        }
      );

      if (functionError) throw functionError;

      // Fallback: If totalInvested is missing, fetch it manually
      let totalInvested = responseData.totalInvested;
      if (!totalInvested) {
        const { data: invData } = await supabase
          .from("investments")
          .select("current_amount, currency")
          .eq("is_active", true);
        
        const invested = { usd: 0, ars: 0 };
        if (invData) {
          invData.forEach(i => {
            const amount = typeof i.current_amount === "string" ? parseFloat(i.current_amount) : i.current_amount;
            if (i.currency === "USD") invested.usd += amount;
            else invested.ars += amount;
          });
        }
        totalInvested = invested;
      }

      const typedTransactions: Transaction[] = (responseData.transactions || []).map((t: any) => ({
        ...t,
        type: t.type as "income" | "expense",
        currency: t.currency as "USD" | "ARS",
        from_savings: t.from_savings || false,
        payment_method: t.payment_method || "cash",
        categoryName: t.categoryName || t.category
      }));

      return {
        ...responseData,
        totalInvested,
        transactions: typedTransactions,
        creditCards: responseData.creditCards || []
      } as DashboardData;
    },
    enabled: !!userId && !!workspaceId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  const updateTransaction = useCallback(async (id: string, transaction: Omit<Transaction, "id">) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          user_id: transaction.user_id,
          payment_method: transaction.payment_method || "cash"
        })
        .eq("id", id);

      if (error) throw error;

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      triggerNotificationHaptic(NotificationType.Success);
      toast.success("Transacción actualizada");
    } catch (err: any) {
      console.error("Error updating transaction:", err);
      toast.error("Error al actualizar transacción");
      throw err;
    }
  }, [queryClient]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      triggerNotificationHaptic(NotificationType.Warning);
      toast.success("Transacción eliminada");
    } catch (err: any) {
      console.error("Error deleting transaction:", err);
      toast.error("Error al eliminar transacción");
      throw err;
    }
  }, [queryClient]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, "id">) => {
    if (!workspaceId) throw new Error("No workspace");
    try {
      const { data: newTransaction, error } = await supabase
        .from("transactions")
        .insert([{
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          user_id: transaction.user_id,
          workspace_id: workspaceId,
          from_savings: transaction.from_savings || false,
          savings_source: transaction.savings_source || null,
          payment_method: transaction.payment_method || "cash"
        }])
        .select()
        .single();

      if (error) throw error;

      // If expense is from savings, handle savings deduction
      if (transaction.type === "expense" && transaction.from_savings && transaction.savings_source) {
        const { data: session } = await supabase.auth.getSession();
        const uid = session?.session?.user?.id;
        
        if (uid && workspaceId) {
          await supabase.from("savings_entries").insert([{
            user_id: uid,
            workspace_id: workspaceId,
            amount: transaction.amount,
            currency: transaction.currency,
            entry_type: "withdrawal",
            savings_type: transaction.savings_source,
            notes: `Gasto: ${transaction.description}`
          }]);

          const { data: savingsRecord } = await supabase
            .from("savings")
            .select("id, usd_amount, ars_amount")
            .limit(1)
            .maybeSingle();

          if (savingsRecord) {
            const currentAmount = transaction.currency === "USD"
              ? (typeof savingsRecord.usd_amount === "string" ? parseFloat(savingsRecord.usd_amount) : savingsRecord.usd_amount)
              : (typeof savingsRecord.ars_amount === "string" ? parseFloat(savingsRecord.ars_amount) : savingsRecord.ars_amount);
            const newAmount = Math.max(0, currentAmount - transaction.amount);

            await supabase
              .from("savings")
              .update(transaction.currency === "USD" ? { usd_amount: newAmount } : { ars_amount: newAmount })
              .eq("id", savingsRecord.id);
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      triggerNotificationHaptic(NotificationType.Success);
      toast.success(`${transaction.type === "income" ? "Ingreso" : "Gasto"} registrado correctamente`);
    } catch (err: any) {
      console.error("Error adding transaction:", err);
      toast.error("Error al registrar transacción");
      throw err;
    }
  }, [queryClient, workspaceId]);

  const updateCurrentSavings = useCallback((savings: { usd: number; ars: number }) => {
    // This could also be a mutation or just invalidation
    queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
  }, [queryClient]);

  const updateSavingsTransfers = useCallback((currency: "USD" | "ARS", amount: number) => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
  }, [queryClient]);

  return {
    data: data || null,
    loading,
    isFetching,
    error: queryError ? (queryError as Error).message : null,
    refetch,
    updateTransaction,
    deleteTransaction,
    addTransaction,
    updateCurrentSavings,
    updateSavingsTransfers
  };
}
