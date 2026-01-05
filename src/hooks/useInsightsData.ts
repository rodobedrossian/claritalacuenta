import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
    generatedAt: string;
  } | null;
}

export interface UseInsightsDataReturn {
  data: InsightsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInsightsData(userId: string | null): UseInsightsDataReturn {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke(
        "generate-insights",
        {
          body: { months_to_analyze: 6 },
        }
      );

      if (fnError) {
        throw fnError;
      }

      setData({
        insights: response.insights || [],
        metadata: response.metadata || null,
      });
    } catch (err) {
      console.error("Error fetching insights:", err);
      const message = err instanceof Error ? err.message : "Error al generar insights";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchInsights();
    }
  }, [userId, fetchInsights]);

  return {
    data,
    loading,
    error,
    refetch: fetchInsights,
  };
}
