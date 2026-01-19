import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

export interface TransactionFilters {
  type: string;
  category: string;
  userId: string;
  startDate: string;
  endDate: string;
}

interface UseTransactionsDataReturn {
  transactions: Transaction[];
  categories: Array<{ id: string; name: string; type: string }>;
  totalCount: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  updateTransaction: (id: string, transaction: Omit<Transaction, "id">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 20;

export function useTransactionsData(
  filters: TransactionFilters,
  userId: string | null
): UseTransactionsDataReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    if (!userId) return;

    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      console.log(`Fetching transactions page ${pageNum}, filters:`, filters);

      const { data: responseData, error: functionError } = await supabase.functions.invoke(
        "get-transactions-data",
        {
          body: {
            page: pageNum,
            limit: ITEMS_PER_PAGE,
            filters: {
              type: filters.type,
              category: filters.category,
              userId: filters.userId,
              startDate: filters.startDate,
              endDate: filters.endDate
            }
          }
        }
      );

      if (functionError) {
        throw functionError;
      }

      // Parse transactions
      const typedTransactions: Transaction[] = (responseData.transactions || []).map((t: any) => ({
        ...t,
        type: t.type as "income" | "expense",
        currency: t.currency as "USD" | "ARS",
        from_savings: t.from_savings || false,
        categoryName: t.categoryName || t.category
      }));

      // Update state
      if (pageNum === 0) {
        setTransactions(typedTransactions);
        // Only update categories on first page
        if (responseData.categories) {
          setCategories(responseData.categories);
        }
      } else {
        setTransactions(prev => [...prev, ...typedTransactions]);
      }

      setTotalCount(responseData.totalCount || 0);
      setHasMore(responseData.hasMore || false);
      setPage(pageNum);

      console.log(`Loaded ${typedTransactions.length} transactions, total: ${responseData.totalCount}`);
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      setError(err.message || "Failed to load transactions");
      toast.error("Error al cargar transacciones");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, filters]);

  // Fetch initial data when filters change
  useEffect(() => {
    if (userId) {
      setTransactions([]);
      setPage(0);
      setHasMore(true);
      fetchTransactions(0, true);
    }
  }, [userId, filters.type, filters.category, filters.userId, filters.startDate, filters.endDate]);

  const loadMore = useCallback(async () => {
    if (!loadingMore && hasMore) {
      await fetchTransactions(page + 1, false);
    }
  }, [loadingMore, hasMore, page, fetchTransactions]);

  const refetch = useCallback(async () => {
    setTransactions([]);
    setPage(0);
    setHasMore(true);
    await fetchTransactions(0, true);
  }, [fetchTransactions]);

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
          user_id: transaction.user_id
        })
        .eq("id", id);

      if (error) throw error;

      // Optimistic update
      setTransactions(prev =>
        prev.map(t => (t.id === id ? { ...transaction, id } : t))
      );

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

      // Optimistic update
      setTransactions(prev => prev.filter(t => t.id !== id));
      setTotalCount(prev => prev - 1);

      toast.success("Transacción eliminada");
    } catch (err: any) {
      console.error("Error deleting transaction:", err);
      toast.error("Error al eliminar transacción");
      throw err;
    }
  }, []);

  return {
    transactions,
    categories,
    totalCount,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refetch,
    updateTransaction,
    deleteTransaction
  };
}
