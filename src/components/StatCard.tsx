import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down";
  onClick?: () => void;
}

export const StatCard = ({ title, value, subtitle, change, icon: Icon, trend, onClick }: StatCardProps) => {
  return (
    <Card 
      className={`p-4 md:p-6 gradient-card border-border/50 hover:border-primary/50 transition-smooth shadow-glow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs md:text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-lg md:text-2xl lg:text-3xl font-bold tracking-tight truncate">{value}</p>
          {subtitle && (
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1 truncate">
              {subtitle}
            </p>
          )}
          {change && (
            <p className={`text-xs md:text-sm flex items-center gap-1 ${
              trend === "up" ? "text-success" : "text-destructive"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="p-2 md:p-3 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
          <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
};
