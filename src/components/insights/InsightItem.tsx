import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Repeat, 
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Insight } from "@/hooks/useInsightsData";

interface InsightItemProps {
  insight: Insight;
  compact?: boolean;
}

const typeConfig = {
  anomaly: {
    icon: AlertTriangle,
    label: "Anomalía",
    className: "text-orange-500",
    bgClassName: "bg-orange-500/10",
  },
  pattern: {
    icon: Repeat,
    label: "Patrón",
    className: "text-blue-500",
    bgClassName: "bg-blue-500/10",
  },
  trend: {
    icon: TrendingUp,
    label: "Tendencia",
    className: "text-emerald-500",
    bgClassName: "bg-emerald-500/10",
  },
  recommendation: {
    icon: Lightbulb,
    label: "Consejo",
    className: "text-purple-500",
    bgClassName: "bg-purple-500/10",
  },
};

const priorityConfig = {
  high: {
    className: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Alta",
  },
  medium: {
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    label: "Media",
  },
  low: {
    className: "bg-muted text-muted-foreground border-border",
    label: "Baja",
  },
};

export function InsightItem({ insight, compact = false }: InsightItemProps) {
  const config = typeConfig[insight.type];
  const priority = priorityConfig[insight.priority];
  const Icon = config.icon;

  // Check if it's a positive or negative trend
  const isNegativeTrend = insight.type === "trend" && 
    typeof insight.data.changePercent === "number" && 
    insight.data.changePercent < 0;

  const TrendIcon = isNegativeTrend ? TrendingDown : Icon;

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-start gap-3 p-3.5 rounded-2xl border border-border/40 transition-all duration-200",
          insight.priority === "high" && "border-destructive/20 bg-destructive/[0.02]"
        )}
      >
        <div className={cn("p-2.5 rounded-xl shrink-0", config.bgClassName)}>
          <TrendIcon className={cn("h-4 w-4", config.className)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm tracking-tight">{insight.title}</p>
          <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-0.5 leading-relaxed">
            {insight.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "p-5 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300",
        insight.priority === "high" && "border-destructive/20 shadow-sm shadow-destructive/5"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-2xl shrink-0 shadow-sm", config.bgClassName)}>
          <TrendIcon className={cn("h-5 w-5", config.className)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider px-1.5 h-5", priority.className)}>
              {priority.label}
            </Badge>
            <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 h-5 bg-muted/50">
              {config.label}
            </Badge>
            {insight.category && (
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-1.5 h-5 opacity-60">
                {insight.category}
              </Badge>
            )}
          </div>
          
          <h4 className="font-bold text-base tracking-tight text-foreground">{insight.title}</h4>
          <p className="text-sm text-muted-foreground/90 mt-1.5 leading-relaxed">
            {insight.description}
          </p>
        </div>
      </div>
    </div>
  );
}
