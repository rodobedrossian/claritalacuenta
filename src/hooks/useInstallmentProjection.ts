import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addMonths, startOfMonth, format, isBefore, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";

export interface Installment {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  installmentCurrent: number;
  installmentTotal: number;
  remainingInstallments: number;
  endMonth: Date;
  creditCardId: string | null;
}

export interface MonthlyProjection {
  month: Date;
  monthLabel: string;
  totalAmountARS: number;
  totalAmountUSD: number;
  freedAmountARS: number;
  freedAmountUSD: number;
  endingInstallments: Installment[];
}

export interface InstallmentProjectionSummary {
  currentMonthlyTotalARS: number;
  currentMonthlyTotalUSD: number;
  nextMonthTotalARS: number;
  nextMonthTotalUSD: number;
  nextMonthFreedARS: number;
  nextMonthFreedUSD: number;
  sixMonthReductionARS: number;
  sixMonthReductionPercent: number;
  totalActiveInstallments: number;
}

export interface UseInstallmentProjectionReturn {
  projections: MonthlyProjection[];
  summary: InstallmentProjectionSummary;
  activeInstallments: Installment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInstallmentProjection(userId: string | null): UseInstallmentProjectionReturn {
  const [projections, setProjections] = useState<MonthlyProjection[]>([]);
  const [summary, setSummary] = useState<InstallmentProjectionSummary>({
    currentMonthlyTotalARS: 0,
    currentMonthlyTotalUSD: 0,
    nextMonthTotalARS: 0,
    nextMonthTotalUSD: 0,
    nextMonthFreedARS: 0,
    nextMonthFreedUSD: 0,
    sixMonthReductionARS: 0,
    sixMonthReductionPercent: 0,
    totalActiveInstallments: 0,
  });
  const [activeInstallments, setActiveInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateProjections = useCallback((installments: Installment[]) => {
    const today = new Date();
    const currentMonth = startOfMonth(today);
    const monthsToProject = 12;

    // Build monthly projections
    const monthlyData: MonthlyProjection[] = [];
    
    for (let i = 0; i < monthsToProject; i++) {
      const projectionMonth = addMonths(currentMonth, i);
      
      // Find installments that are still active in this month
      const activeInMonth = installments.filter(inst => {
        const endMonth = inst.endMonth;
        return !isBefore(endMonth, projectionMonth);
      });

      // Find installments that end exactly in this month
      const endingThisMonth = installments.filter(inst => 
        isSameMonth(inst.endMonth, projectionMonth)
      );

      // Calculate totals for this month
      const totalARS = activeInMonth
        .filter(i => i.currency === "ARS")
        .reduce((sum, i) => sum + i.amount, 0);
      
      const totalUSD = activeInMonth
        .filter(i => i.currency === "USD")
        .reduce((sum, i) => sum + i.amount, 0);

      // Calculate freed amount (compared to previous month)
      const prevMonth = i > 0 ? monthlyData[i - 1] : null;
      const freedARS = prevMonth ? prevMonth.totalAmountARS - totalARS : 0;
      const freedUSD = prevMonth ? prevMonth.totalAmountUSD - totalUSD : 0;

      monthlyData.push({
        month: projectionMonth,
        monthLabel: format(projectionMonth, "MMM yyyy", { locale: es }),
        totalAmountARS: totalARS,
        totalAmountUSD: totalUSD,
        freedAmountARS: freedARS,
        freedAmountUSD: freedUSD,
        endingInstallments: endingThisMonth,
      });
    }

    // Calculate summary - use next month as reference since current month is already paid
    const currentMonthData = monthlyData[0];
    const nextMonthData = monthlyData[1];
    const seventhMonthData = monthlyData[6]; // 6 months from next month

    const summaryData: InstallmentProjectionSummary = {
      currentMonthlyTotalARS: currentMonthData?.totalAmountARS || 0,
      currentMonthlyTotalUSD: currentMonthData?.totalAmountUSD || 0,
      nextMonthTotalARS: nextMonthData?.totalAmountARS || 0,
      nextMonthTotalUSD: nextMonthData?.totalAmountUSD || 0,
      nextMonthFreedARS: nextMonthData?.freedAmountARS || 0,
      nextMonthFreedUSD: nextMonthData?.freedAmountUSD || 0,
      sixMonthReductionARS: nextMonthData && seventhMonthData 
        ? nextMonthData.totalAmountARS - seventhMonthData.totalAmountARS 
        : 0,
      sixMonthReductionPercent: nextMonthData && seventhMonthData && nextMonthData.totalAmountARS > 0
        ? Math.round(((nextMonthData.totalAmountARS - seventhMonthData.totalAmountARS) / nextMonthData.totalAmountARS) * 100)
        : 0,
      totalActiveInstallments: installments.length,
    };

    return { monthlyData, summaryData };
  }, []);

  const fetchInstallments = useCallback(async () => {
    if (!userId) {
      setProjections([]);
      setActiveInstallments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all installment transactions for the user
      const { data, error: fetchError } = await supabase
        .from("credit_card_transactions")
        .select("id, description, amount, currency, date, installment_current, installment_total, credit_card_id")
        .eq("user_id", userId)
        .eq("transaction_type", "cuota")
        .not("installment_current", "is", null)
        .not("installment_total", "is", null)
        .order("date", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform and deduplicate installments
      // We need the most recent entry for each unique installment (by description)
      const installmentMap = new Map<string, Installment>();
      
      for (const row of data || []) {
        const key = `${row.description}-${row.installment_total}`;
        
        // Only keep the most recent entry for each installment
        if (!installmentMap.has(key)) {
          const installmentCurrent = row.installment_current || 0;
          const installmentTotal = row.installment_total || 0;
          const remaining = installmentTotal - installmentCurrent;
          
          // Calculate end month based on current installment and remaining
          const today = new Date();
          const currentMonth = startOfMonth(today);
          const endMonth = addMonths(currentMonth, remaining);

          installmentMap.set(key, {
            id: row.id,
            description: row.description,
            amount: row.amount,
            currency: row.currency,
            date: row.date,
            installmentCurrent,
            installmentTotal,
            remainingInstallments: remaining,
            endMonth,
            creditCardId: row.credit_card_id,
          });
        }
      }

      const installments = Array.from(installmentMap.values())
        .filter(i => i.remainingInstallments > 0) // Only active installments
        .sort((a, b) => a.remainingInstallments - b.remainingInstallments); // Sort by soonest to end

      setActiveInstallments(installments);

      // Calculate projections
      const { monthlyData, summaryData } = calculateProjections(installments);
      setProjections(monthlyData);
      setSummary(summaryData);

    } catch (err) {
      console.error("Error fetching installments:", err);
      setError("Error al cargar las cuotas");
    } finally {
      setLoading(false);
    }
  }, [userId, calculateProjections]);

  useEffect(() => {
    fetchInstallments();
  }, [fetchInstallments]);

  return {
    projections,
    summary,
    activeInstallments,
    loading,
    error,
    refetch: fetchInstallments,
  };
}
