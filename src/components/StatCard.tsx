import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down";
}

export const StatCard = ({ title, value, subtitle, change, icon: Icon, trend }: StatCardProps) => {
  return (
    <Card className="p-6 gradient-card border-border/50 hover:border-primary/50 transition-smooth shadow-glow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
          {change && (
            <p className={`text-sm flex items-center gap-1 ${
              trend === "up" ? "text-success" : "text-destructive"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
};
