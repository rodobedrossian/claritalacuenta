import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MonthlyBalance {
  availableUSD: number;
  availableARS: number;
}

export function useMonthlyBalance(userId: string | null) {
  const [balance, setBalance] = useState<MonthlyBalance>({ availableUSD: 0, availableARS: 0 });
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Get current month in YYYY-MM format
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const { data, error } = await supabase.functions.invoke("get-dashboard-data", {
        body: { month }
      });

      if (error) throw error;

      const totals = data.totals || {
        incomeUSD: 0,
        incomeARS: 0,
        expensesUSD: 0,
        expensesARS: 0,
        savingsTransfersUSD: 0,
        savingsTransfersARS: 0
      };

      // Calculate available balance (income - expenses - already transferred to savings)
      const availableUSD = Math.max(0, totals.incomeUSD - totals.expensesUSD - totals.savingsTransfersUSD);
      const availableARS = Math.max(0, totals.incomeARS - totals.expensesARS - totals.savingsTransfersARS);

      setBalance({ availableUSD, availableARS });
    } catch (err) {
      console.error("Error fetching monthly balance:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refetch: fetchBalance };
}
