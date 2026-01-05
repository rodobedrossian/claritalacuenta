import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightItem } from "./InsightItem";
import type { Insight } from "@/hooks/useInsightsData";
import { cn } from "@/lib/utils";

interface InsightsCardProps {
  insights: Insight[];
  loading: boolean;
  onRefresh: () => void;
}

export function InsightsCard({ insights, loading, onRefresh }: InsightsCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  // Show only top 3 insights on dashboard
  const displayInsights = insights.slice(0, 3);
  const hasMore = insights.length > 3;

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-8 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay suficientes datos para generar insights todavía
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">Insights del Mes</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-2">
          <div className="space-y-2">
            {displayInsights.map((insight, index) => (
              <InsightItem key={index} insight={insight} compact />
            ))}
          </div>

          {hasMore && (
            <Button
              variant="ghost"
              className="w-full mt-3 text-primary"
              onClick={() => navigate("/insights")}
            >
              Ver todos los insights
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
