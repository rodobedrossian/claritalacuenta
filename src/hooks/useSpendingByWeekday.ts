import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface CategoryAmount {
  categoryName: string;
  amount: number;
  currency: string;
  amountARS: number;
}

export interface WeekdayData {
  weekday: number;
  label: string;
  total: number;
  byCategory: CategoryAmount[];
}

export interface SpendingByWeekdayData {
  byWeekday: WeekdayData[];
  exchangeRate?: number;
}

export interface UseSpendingByWeekdayReturn {
  data: SpendingByWeekdayData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const emptyData: SpendingByWeekdayData = { byWeekday: [], exchangeRate: undefined };

export function useSpendingByWeekday(
  days: 30 | 60,
  workspaceId: string | null
): UseSpendingByWeekdayReturn {
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ["spending-by-weekday", days, workspaceId],
    queryFn: async (): Promise<SpendingByWeekdayData> => {
      const { data: response, error: fnError } = await supabase.functions.invoke(
        "get-spending-by-weekday",
        {
          body: { days, workspace_id: workspaceId ?? undefined },
        }
      );

      if (fnError) {
        console.error("get-spending-by-weekday error:", fnError);
        return emptyData;
      }

      if (response?.error) {
        console.error("get-spending-by-weekday response error:", response.error);
        return emptyData;
      }

      return {
        byWeekday: response?.byWeekday ?? [],
        exchangeRate: response?.exchangeRate,
      };
    },
    enabled: true,
    staleTime: 1000 * 60 * 5,
  });

  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  return {
    data: data ?? null,
    loading,
    error: queryError ? (queryError as Error).message : null,
    refetch,
  };
}
