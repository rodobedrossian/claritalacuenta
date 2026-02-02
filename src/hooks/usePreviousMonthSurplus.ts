import { useState, useEffect, useCallback } from "react";
import { format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export interface MonthlySurplusRecord {
  id: string;
  user_id: string;
  month: string;
  surplus_usd: number;
  surplus_ars: number;
  status: "pending" | "saved" | "ignored";
  saved_at: string | null;
  ignored_at: string | null;
  created_at: string;
  updated_at: string;
}

function getPreviousMonthStr(): string {
  const prev = subMonths(new Date(), 1);
  return format(prev, "yyyy-MM");
}

function getMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return format(date, "LLLL yyyy", { locale: es });
}

export function usePreviousMonthSurplus(userId: string | null) {
  const [record, setRecord] = useState<MonthlySurplusRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const previousMonth = getPreviousMonthStr();
  const monthLabel = getMonthLabel(previousMonth);

  const fetchOrCreate = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1. Check if record exists
      const { data: existing, error: fetchError } = await supabase
        .from("monthly_surpluses")
        .select("*")
        .eq("user_id", userId)
        .eq("month", previousMonth)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching monthly surplus:", fetchError);
        setLoading(false);
        return;
      }

      if (existing) {
        setRecord({
          ...existing,
          surplus_usd: typeof existing.surplus_usd === "string" ? parseFloat(existing.surplus_usd) : existing.surplus_usd,
          surplus_ars: typeof existing.surplus_ars === "string" ? parseFloat(existing.surplus_ars) : existing.surplus_ars,
        });
        setLoading(false);
        return;
      }

      // 2. No record - fetch previous month dashboard data and compute surplus
      const { data: dashboardData, error: dashboardError } = await supabase.functions.invoke("get-dashboard-data", {
        body: { month: previousMonth },
      });

      if (dashboardError) {
        console.error("Error fetching dashboard data for surplus:", dashboardError);
        setLoading(false);
        return;
      }

      const totals = dashboardData?.totals || {
        incomeUSD: 0,
        incomeARS: 0,
        expensesUSD: 0,
        expensesARS: 0,
        savingsTransfersUSD: 0,
        savingsTransfersARS: 0,
      };

      const exchangeRate = dashboardData?.exchangeRate?.rate ?? 1300;
      const netUSD = totals.incomeUSD - totals.expensesUSD - totals.savingsTransfersUSD;
      const netARS = totals.incomeARS - totals.expensesARS - totals.savingsTransfersARS;
      const totalNetARS = netUSD * exchangeRate + netARS;

      if (totalNetARS <= 0) {
        setRecord(null);
        setLoading(false);
        return;
      }

      // 3. Insert new record (surplus_ars = total in ARS, surplus_usd = 0)
      const { data: inserted, error: insertError } = await supabase
        .from("monthly_surpluses")
        .insert({
          user_id: userId,
          month: previousMonth,
          surplus_usd: 0,
          surplus_ars: totalNetARS,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting monthly surplus:", insertError);
        setLoading(false);
        return;
      }

      setRecord({
        ...inserted,
        surplus_usd: typeof inserted.surplus_usd === "string" ? parseFloat(inserted.surplus_usd) : inserted.surplus_usd,
        surplus_ars: typeof inserted.surplus_ars === "string" ? parseFloat(inserted.surplus_ars) : inserted.surplus_ars,
      });
    } catch (err) {
      console.error("Error in usePreviousMonthSurplus:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, previousMonth]);

  useEffect(() => {
    fetchOrCreate();
  }, [fetchOrCreate]);

  const acknowledgeAsSaved = useCallback(async () => {
    if (!record) return;

    const { error } = await supabase
      .from("monthly_surpluses")
      .update({ status: "saved", saved_at: new Date().toISOString() })
      .eq("id", record.id);

    if (error) {
      console.error("Error acknowledging surplus as saved:", error);
      throw error;
    }

    setRecord((prev) => (prev ? { ...prev, status: "saved" as const } : null));
  }, [record?.id]);

  const acknowledgeAsIgnored = useCallback(async () => {
    if (!record) return;

    const { error } = await supabase
      .from("monthly_surpluses")
      .update({ status: "ignored", ignored_at: new Date().toISOString() })
      .eq("id", record.id);

    if (error) {
      console.error("Error acknowledging surplus as ignored:", error);
      throw error;
    }

    setRecord((prev) => (prev ? { ...prev, status: "ignored" as const } : null));
  }, [record?.id]);

  const shouldShowBanner = record?.status === "pending" && (record.surplus_usd > 0 || record.surplus_ars > 0);

  return {
    record,
    monthLabel,
    loading,
    refetch: fetchOrCreate,
    acknowledgeAsSaved,
    acknowledgeAsIgnored,
    shouldShowBanner,
  };
}
