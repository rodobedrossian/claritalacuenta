import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightItem } from "./InsightItem";
import type { Insight } from "@/hooks/useInsightsData";

interface InsightsCardProps {
  insights: Insight[];
  loading: boolean;
  onRefresh: () => void;
}

export function InsightsCard({ insights, loading }: InsightsCardProps) {
  const navigate = useNavigate();

  // Show only the first/most important insight
  const topInsight = insights[0];
  const hasMore = insights.length > 1;

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    );
  }

  if (!topInsight) {
    return null; // Don't show anything if no insights
  }

  return (
    <div className="space-y-2">
      {/* Single insight - compact */}
      <InsightItem insight={topInsight} compact />
      
      {/* See all button - minimal */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8 text-xs text-muted-foreground hover:text-primary"
          onClick={() => navigate("/insights")}
        >
          Ver {insights.length - 1} insights más
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      )}
    </div>
  );
}
