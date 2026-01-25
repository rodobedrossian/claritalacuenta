import { useNavigate } from "react-router-dom";
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Repeat, 
  Lightbulb,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const navigate = useNavigate();
  const config = typeConfig[insight.type];
  const priority = priorityConfig[insight.priority];
  const Icon = config.icon;

  // Check if it's a positive or negative trend
  const isNegativeTrend = insight.type === "trend" && 
    typeof insight.data.changePercent === "number" && 
    insight.data.changePercent < 0;

  const TrendIcon = isNegativeTrend ? TrendingDown : Icon;

  const handleAction = () => {
    if (insight.action?.route) {
      navigate(insight.action.route);
    }
  };

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
          "hover:bg-muted/50 cursor-pointer",
          insight.priority === "high" && "border-destructive/30 bg-destructive/5"
        )}
        onClick={handleAction}
      >
        <div className={cn("p-2 rounded-lg shrink-0", config.bgClassName)}>
          <TrendIcon className={cn("h-4 w-4", config.className)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{insight.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {insight.description}
          </p>
        </div>
        {insight.action && (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "p-4 rounded-xl border bg-card transition-all",
        insight.priority === "high" && "border-destructive/30 shadow-lg shadow-destructive/5"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-xl shrink-0", config.bgClassName)}>
          <TrendIcon className={cn("h-5 w-5", config.className)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className={cn("text-xs", priority.className)}>
              {priority.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {config.label}
            </Badge>
            {insight.category && (
              <Badge variant="outline" className="text-xs">
                {insight.category}
              </Badge>
            )}
          </div>
          
          <h4 className="font-semibold text-foreground">{insight.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {insight.description}
          </p>

          {insight.action && (
            <Button
              variant="link"
              size="sm"
              className="px-0 h-auto mt-2"
              onClick={handleAction}
            >
              {insight.action.label}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
