import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatKPICardProps {
  label: string;
  value: string;
  change_percent?: number;
  change_label?: string;
}

export function ChatKPICard({ label, value, change_percent, change_label }: ChatKPICardProps) {
  const isPositive = change_percent != null && change_percent > 0;
  const isNegative = change_percent != null && change_percent < 0;

  return (
    <div className="my-3 rounded-xl bg-card p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      {change_percent != null && (
        <div className="flex items-center gap-1 mt-2">
          {isPositive && <TrendingUp className="h-3.5 w-3.5 text-green-600" />}
          {isNegative && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
          {!isPositive && !isNegative && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
          <span
            className={cn(
              "text-xs font-medium",
              isPositive && "text-green-600",
              isNegative && "text-red-500",
              !isPositive && !isNegative && "text-muted-foreground"
            )}
          >
            {change_percent > 0 ? "+" : ""}
            {change_percent.toFixed(1)}%
          </span>
          {change_label && (
            <span className="text-xs text-muted-foreground ml-1">{change_label}</span>
          )}
        </div>
      )}
    </div>
  );
}
