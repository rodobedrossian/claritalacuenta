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
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
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
  const totalTransactions = metadata ? metadata.totalTransactions + (metadata.totalStatementTransactions || 0) : 0;

  return (
    <div className={cn("space-y-6 pb-12", !isMobile && "space-y-8")}>
      {/* Header - Desktop: hero-style / Mobile: minimal */}
      <div className={cn(
        "flex items-center justify-between",
        !isMobile && "flex-row gap-6"
      )}>
        <div className={cn(
          "flex flex-col",
          !isMobile && "gap-1"
        )}>
          {metadata && (
            <span className={cn(
              "font-medium text-muted-foreground uppercase tracking-wider",
              isMobile ? "text-[10px]" : "text-xs"
            )}>
              {metadata.analyzedMonths} meses • {totalTransactions} transacciones analizadas
            </span>
          )}
        </div>
        <Button 
          onClick={onRefresh} 
          disabled={loading} 
          variant={isMobile ? "ghost" : "outline"}
          size={isMobile ? "icon" : "sm"}
          className={cn(
            isMobile ? "h-9 w-9 rounded-full bg-muted/30 hover:bg-muted/50" : "gap-2"
          )}
        >
          <RefreshCw className={cn("h-4 w-4 text-muted-foreground", loading && "animate-spin")} />
          {!isMobile && "Actualizar"}
        </Button>
      </div>

      {/* Filters Row - Desktop: single bar / Mobile: stacked */}
      <div className={cn(
        "flex gap-4",
        isMobile ? "flex-col" : "flex-row items-center justify-between"
      )}>
        <div className={cn(
          "w-full overflow-x-auto no-scrollbar",
          isMobile ? "-mx-4 px-4" : "flex-1"
        )}>
          <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-full">
            <TabsList className={cn(
              "bg-muted/40 p-1 h-10",
              isMobile ? "w-full justify-start sm:justify-center" : "inline-flex"
            )}>
              {typeFilters.map((filter) => (
                <TabsTrigger 
                  key={filter.value} 
                  value={filter.value}
                  className={cn(
                    "px-4 py-1.5 font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all",
                    isMobile ? "text-xs" : "text-sm"
                  )}
                >
                  {filter.label}
                  {countByType[filter.value] > 0 && (
                    <span className="ml-1.5 opacity-60 font-bold">{countByType[filter.value]}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "font-medium text-muted-foreground hover:text-foreground gap-1",
                isMobile ? "h-8 px-2 text-xs justify-start" : "shrink-0"
              )}
            >
              <Filter className="h-3 w-3" />
              {currentPriorityLabel}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isMobile ? "start" : "end"} className="w-48">
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

      {/* Insights grid - Desktop: 2-3 columns / Mobile: single column */}
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
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
        )}>
          {filteredInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <InsightItem insight={insight} compact={!isMobile} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
