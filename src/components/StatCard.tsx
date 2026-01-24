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
      className={`p-6 bg-card hover:shadow-stripe-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
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
        <div className="p-3 rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
};
