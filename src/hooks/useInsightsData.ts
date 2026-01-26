import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface Insight {
  type: "anomaly" | "pattern" | "trend" | "recommendation";
  priority: "high" | "medium" | "low";
  category: string | null;
  title: string;
  description: string;
  data: Record<string, unknown>;
  action?: { label: string; route: string };
}

export interface InsightsData {
  insights: Insight[];
  metadata: {
    analyzedMonths: number;
    totalTransactions: number;
    totalStatementTransactions: number;
    generatedAt: string;
  } | null;
}

export interface UseInsightsDataReturn {
  data: InsightsData | null;
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInsightsData(userId: string | null): UseInsightsDataReturn {
  const queryClient = useQueryClient();

  const { 
    data, 
    isLoading: loading, 
    isFetching,
    error: queryError,
    refetch: queryRefetch 
  } = useQuery({
    queryKey: ["insights-data", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data: response, error: fnError } = await supabase.functions.invoke(
        "generate-insights",
        {
          body: { months_to_analyze: 6 },
        }
      );

      if (fnError) throw fnError;

      return {
        insights: response.insights || [],
        metadata: response.metadata || null,
      } as InsightsData;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 15, // 15 minutos
  });

  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  return {
    data: data || null,
    loading,
    isFetching,
    error: queryError ? (queryError as Error).message : null,
    refetch,
  };
}
