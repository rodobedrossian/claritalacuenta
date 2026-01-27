import { useState, useMemo } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  Filter,
  AlertTriangle,
  Repeat,
  TrendingUp,
  Lightbulb,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightItem } from "./InsightItem";
import type { Insight } from "@/hooks/useInsightsData";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface InsightsPanelProps {
  insights: Insight[];
  loading: boolean;
  metadata: {
    analyzedMonths: number;
    totalTransactions: number;
    totalStatementTransactions: number;
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

  const currentPriorityLabel = priorityFilters.find(f => f.value === priorityFilter)?.label;

  return (
    <div className="space-y-6 pb-12">
      {/* Header - Minimal iOS Style */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold tracking-tight">Análisis inteligente</h2>
          {metadata && (
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              {metadata.analyzedMonths} meses • {metadata.totalTransactions + (metadata.totalStatementTransactions || 0)} transacciones
            </span>
          )}
        </div>
        <Button 
          onClick={onRefresh} 
          disabled={loading} 
          variant="ghost" 
          size="icon"
          className="h-9 w-9 rounded-full bg-muted/30 hover:bg-muted/50"
        >
          <RefreshCw className={cn("h-4 w-4 text-muted-foreground", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Filters Row - Compact */}
      <div className="flex flex-col gap-4">
        {/* Type Filter - Segmented Control Style */}
        <div className="w-full overflow-x-auto no-scrollbar -mx-4 px-4">
          <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-full">
            <TabsList className="bg-muted/40 p-1 h-10 w-full justify-start sm:justify-center">
              {typeFilters.map((filter) => (
                <TabsTrigger 
                  key={filter.value} 
                  value={filter.value}
                  className="px-4 py-1.5 text-xs font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  {filter.label}
                  {countByType[filter.value] > 0 && (
                    <span className="ml-1.5 opacity-40 font-bold">{countByType[filter.value]}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Priority Filter - Minimal Dropdown */}
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1">
                <Filter className="h-3 w-3" />
                {currentPriorityLabel}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {priorityFilters.map((filter) => (
                <DropdownMenuItem 
                  key={filter.value} 
                  onClick={() => setPriorityFilter(filter.value)}
                  className={cn("text-xs", priorityFilter === filter.value && "bg-muted font-medium")}
                >
                  {filter.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Insights list */}
      {filteredInsights.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="p-4 rounded-full bg-muted/30 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-sm font-semibold mb-1">Sin resultados</h3>
          <p className="text-xs text-muted-foreground px-8">
            {insights.length === 0
              ? "Necesitamos más datos para generar insights útiles."
              : "No hay insights que coincidan con los filtros seleccionados."}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {filteredInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <InsightItem insight={insight} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
