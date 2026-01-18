import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

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
  is_projected?: boolean;
  credit_card_id?: string | null;
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
    projectedExpensesUSD: number;
    projectedExpensesARS: number;
    savingsTransfersUSD: number;
    savingsTransfersARS: number;
  };
  currentSavings: {
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
  error: string | null;
  refetch: () => Promise<void>;
  // Local state update functions for optimistic updates
  updateTransaction: (id: string, transaction: Omit<Transaction, "id">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateCurrentSavings: (savings: { usd: number; ars: number }) => void;
  updateSavingsTransfers: (currency: "USD" | "ARS", amount: number) => void;
}

export function useDashboardData(activeMonth: Date, userId: string | null): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const monthStr = format(activeMonth, "yyyy-MM");
      console.log(`Fetching dashboard data for month: ${monthStr}`);

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("No active session");
      }

      const { data: responseData, error: functionError } = await supabase.functions.invoke(
        "get-dashboard-data",
        {
          body: { month: monthStr }
        }
      );

      if (functionError) {
        throw functionError;
      }

      // Type-cast transactions to ensure correct types
      const typedTransactions: Transaction[] = (responseData.transactions || []).map((t: any) => ({
        ...t,
        type: t.type as "income" | "expense",
        currency: t.currency as "USD" | "ARS",
        from_savings: t.from_savings || false,
        payment_method: t.payment_method || "cash",
        is_projected: t.is_projected || false,
        categoryName: t.categoryName || t.category
      }));

      setData({
        ...responseData,
        transactions: typedTransactions,
        totals: {
          ...responseData.totals,
          projectedExpensesUSD: responseData.totals.projectedExpensesUSD || 0,
          projectedExpensesARS: responseData.totals.projectedExpensesARS || 0
        },
        creditCards: responseData.creditCards || []
      });

      console.log(`Dashboard data loaded: ${typedTransactions.length} transactions`);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
      toast.error("Error al cargar datos del dashboard");
    } finally {
      setLoading(false);
    }
  }, [activeMonth, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          payment_method: transaction.payment_method || "cash",
          is_projected: transaction.is_projected || false,
          credit_card_id: transaction.credit_card_id || null
        })
        .eq("id", id);

      if (error) throw error;

      // Optimistically update local state
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          transactions: prev.transactions.map(t =>
            t.id === id ? { ...transaction, id } : t
          )
        };
      });

      toast.success("Transacción actualizada");
    } catch (err: any) {
      console.error("Error updating transaction:", err);
      toast.error("Error al actualizar transacción");
      throw err;
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Optimistically update local state
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          transactions: prev.transactions.filter(t => t.id !== id)
        };
      });

      toast.success("Transacción eliminada");
    } catch (err: any) {
      console.error("Error deleting transaction:", err);
      toast.error("Error al eliminar transacción");
      throw err;
    }
  }, []);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, "id">) => {
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
          from_savings: transaction.from_savings || false,
          savings_source: transaction.savings_source || null,
          payment_method: transaction.payment_method || "cash",
          is_projected: transaction.is_projected || false,
          credit_card_id: transaction.credit_card_id || null
        }])
        .select()
        .single();

      if (error) throw error;

      // If expense is from savings, handle savings deduction
      if (transaction.type === "expense" && transaction.from_savings && transaction.savings_source) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;
        
        if (userId) {
          // Create savings withdrawal entry
          await supabase.from("savings_entries").insert([{
            user_id: userId,
            amount: transaction.amount,
            currency: transaction.currency,
            entry_type: "withdrawal",
            savings_type: transaction.savings_source,
            notes: `Gasto: ${transaction.description}`
          }]);

          // Update savings table
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

            // Update local savings state
            setData(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                currentSavings: {
                  ...prev.currentSavings,
                  [transaction.currency === "USD" ? "usd" : "ars"]: newAmount
                }
              };
            });
          }
        }
      }

      // Optimistically update local state
      const typedTransaction: Transaction = {
        ...newTransaction,
        type: newTransaction.type as "income" | "expense",
        currency: newTransaction.currency as "USD" | "ARS",
        amount: typeof newTransaction.amount === "string" ? parseFloat(newTransaction.amount) : newTransaction.amount,
        from_savings: newTransaction.from_savings || false,
        savings_source: newTransaction.savings_source,
        payment_method: newTransaction.payment_method || "cash",
        is_projected: newTransaction.is_projected || false,
        credit_card_id: newTransaction.credit_card_id
      };

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          transactions: [typedTransaction, ...prev.transactions]
        };
      });

      toast.success(`${transaction.type === "income" ? "Ingreso" : "Gasto"} registrado correctamente`);
    } catch (err: any) {
      console.error("Error adding transaction:", err);
      toast.error("Error al registrar transacción");
      throw err;
    }
  }, []);

  const updateCurrentSavings = useCallback((savings: { usd: number; ars: number }) => {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        currentSavings: savings
      };
    });
  }, []);

  const updateSavingsTransfers = useCallback((currency: "USD" | "ARS", amount: number) => {
    setData(prev => {
      if (!prev) return prev;
      const key = currency === "USD" ? "savingsTransfersUSD" : "savingsTransfersARS";
      return {
        ...prev,
        totals: {
          ...prev.totals,
          [key]: prev.totals[key] + amount
        }
      };
    });
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    updateTransaction,
    deleteTransaction,
    addTransaction,
    updateCurrentSavings,
    updateSavingsTransfers
  };
}
