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

  return (
    <Card 
      className={cn(
        "p-4 bg-card hover:shadow-md transition-all duration-200 border-border/50",
        onClick && "cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Left: Icon */}
        <div className={cn("p-2.5 rounded-2xl shrink-0", styles.iconBg)}>
          <Icon className={cn("h-5 w-5", styles.iconColor)} />
        </div>

        {/* Center: Title and Main Value */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-0.5">{title}</p>
          <div className={cn("text-xl font-bold tracking-tight truncate", styles.valueColor)}>
            {value}
          </div>
        </div>

        {/* Right: Secondary values or Arrow */}
        <div className="flex flex-col items-end justify-center text-right shrink-0">
          {secondaryTop && (
            <p className="text-xs font-medium text-muted-foreground/70 mb-1">
              {secondaryTop}
            </p>
          )}
          {secondaryBottom && (
            <p className="text-xs font-medium text-muted-foreground/70">
              {secondaryBottom}
            </p>
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
    </Card>
  );
};
