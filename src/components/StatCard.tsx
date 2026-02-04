import { LucideIcon, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | ReactNode;
  secondaryTop?: string;
  secondaryBottom?: string;
  icon: LucideIcon;
  variant?: "success" | "destructive" | "primary";
  onClick?: () => void;
}

export const StatCard = ({ 
  title, 
  value, 
  secondaryTop, 
  secondaryBottom, 
  icon: Icon, 
  variant = "primary", 
  onClick 
}: StatCardProps) => {
  const variantStyles = {
    success: {
      iconBg: "bg-success/10",
      iconColor: "text-success",
      valueColor: "text-success",
    },
    destructive: {
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      valueColor: "text-destructive",
    },
    primary: {
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      valueColor: "text-primary",
    },
  };

  const styles = variantStyles[variant];
  const hasSecondary = !!(secondaryTop || secondaryBottom);

  return (
    <Card 
      className={cn(
        "p-4 bg-card hover:shadow-md transition-all duration-200 border-border/50",
        onClick && "cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
      )}
      onClick={onClick}
    >
      {/* Mobile: original row layout (unchanged) */}
      <div className="flex md:hidden items-center gap-4">
        <div className={cn("p-2.5 rounded-2xl shrink-0", styles.iconBg)}>
          <Icon className={cn("h-5 w-5", styles.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">{title}</p>
          <div className={cn("text-lg sm:text-xl font-black tracking-tight break-all", styles.valueColor)}>
            {value}
          </div>
        </div>
        <div className="flex flex-col items-end justify-center text-right shrink-0">
          {secondaryTop && (
            <p className="text-xs font-medium text-muted-foreground/70 mb-1">{secondaryTop}</p>
          )}
          {secondaryBottom && (
            <p className="text-xs font-medium text-muted-foreground/70">{secondaryBottom}</p>
          )}
          {onClick && !secondaryTop && !secondaryBottom && (
            <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
          )}
          {onClick && (secondaryTop || secondaryBottom) && (
            <div className="mt-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </div>

      {/* Desktop (md+): column layout, amounts on one line */}
      <div className="hidden md:flex flex-col gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("p-2.5 rounded-2xl shrink-0", styles.iconBg)}>
            <Icon className={cn("h-5 w-5", styles.iconColor)} />
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground/60 uppercase tracking-widest truncate min-w-0 whitespace-nowrap">
            {title}
          </p>
        </div>
        <div className={cn("min-w-0 text-base sm:text-lg md:text-xl font-black tracking-tight tabular-nums", styles.valueColor)}>
          {typeof value === "string" ? (
            <span className="whitespace-nowrap block overflow-x-auto no-scrollbar">{value}</span>
          ) : (
            value
          )}
        </div>
        <div className="flex items-center justify-between gap-2 min-w-0">
          {hasSecondary ? (
            <p className="text-xs font-medium text-muted-foreground/70 truncate min-w-0">
              {[secondaryTop, secondaryBottom].filter(Boolean).join("  ·  ")}
            </p>
          ) : (
            <span />
          )}
          {onClick && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          )}
        </div>
      </div>
    </Card>
  );
};
