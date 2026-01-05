import { useState, useMemo } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  Filter,
  AlertTriangle,
  Repeat,
  TrendingUp,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InsightItem } from "./InsightItem";
import type { Insight } from "@/hooks/useInsightsData";
import { cn } from "@/lib/utils";

interface InsightsPanelProps {
  insights: Insight[];
  loading: boolean;
  metadata: {
    analyzedMonths: number;
    totalTransactions: number;
    generatedAt: string;
  } | null;
  onRefresh: () => void;
}

const typeFilters = [
  { value: "all", label: "Todos", icon: Sparkles },
  { value: "anomaly", label: "Anomalías", icon: AlertTriangle },
  { value: "pattern", label: "Patrones", icon: Repeat },
  { value: "trend", label: "Tendencias", icon: TrendingUp },
  { value: "recommendation", label: "Consejos", icon: Lightbulb },
];

const priorityFilters = [
  { value: "all", label: "Todas las prioridades" },
  { value: "high", label: "Alta prioridad" },
  { value: "medium", label: "Media prioridad" },
  { value: "low", label: "Baja prioridad" },
];

export function InsightsPanel({ insights, loading, metadata, onRefresh }: InsightsPanelProps) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filteredInsights = useMemo(() => {
    return insights.filter((insight) => {
      const matchesType = typeFilter === "all" || insight.type === typeFilter;
      const matchesPriority = priorityFilter === "all" || insight.priority === priorityFilter;
      return matchesType && matchesPriority;
    });
  }, [insights, typeFilter, priorityFilter]);

  // Count by type for badges
  const countByType = useMemo(() => {
    const counts: Record<string, number> = { all: insights.length };
    insights.forEach((insight) => {
      counts[insight.type] = (counts[insight.type] || 0) + 1;
    });
    return counts;
  }, [insights]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Insights Financieros</h2>
              {metadata && (
                <p className="text-sm text-muted-foreground">
                  Análisis de {metadata.analyzedMonths} meses • {metadata.totalTransactions} transacciones
                </p>
              )}
            </div>
          </div>
        </div>
        <Button onClick={onRefresh} disabled={loading} variant="outline">
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        {typeFilters.map((filter) => {
          const Icon = filter.icon;
          const count = countByType[filter.value] || 0;
          const isActive = typeFilter === filter.value;
          
          return (
            <Button
              key={filter.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(filter.value)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {filter.label}
              {count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-1 h-5 px-1.5 text-xs",
                    isActive && "bg-primary-foreground/20 text-primary-foreground"
                  )}
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityFilters.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Insights list */}
      {filteredInsights.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay insights</h3>
          <p className="text-muted-foreground">
            {insights.length === 0
              ? "Necesitamos más datos para generar insights útiles"
              : "No hay insights que coincidan con los filtros seleccionados"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInsights.map((insight, index) => (
            <InsightItem key={index} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
