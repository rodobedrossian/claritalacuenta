import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MonthlyProjection } from "@/hooks/useInstallmentProjection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

interface InstallmentProjectionChartProps {
  projections: MonthlyProjection[];
}

export const InstallmentProjectionChart = ({ projections }: InstallmentProjectionChartProps) => {
  // Show next 8 months for better visibility
  const chartData = projections.slice(0, 8).map((p, index) => ({
    month: p.monthLabel.charAt(0).toUpperCase() + p.monthLabel.slice(1),
    totalARS: p.totalAmountARS,
    freed: p.freedAmountARS,
    isFirst: index === 0,
  }));

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">
            Total cuotas: <span className="text-foreground font-medium">${data.totalARS.toLocaleString()}</span>
          </p>
          {data.freed > 0 && (
            <p className="text-sm text-success">
              ↓ ${data.freed.toLocaleString()} menos que el mes anterior
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculate color opacity based on position (earlier = more opaque)
  const getBarColor = (index: number) => {
    const baseOpacity = 1 - (index * 0.08);
    return `hsl(var(--primary) / ${Math.max(0.4, baseOpacity)})`;
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-success" />
          Evolución de Cuotas Mensuales
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Proyección de tu compromiso mensual en cuotas
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis 
                type="number" 
                tickFormatter={formatCurrency}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                type="category" 
                dataKey="month"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
              <Bar 
                dataKey="totalARS" 
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary" />
            <span>Compromiso mensual en cuotas</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-success" />
            <span>Cuotas que terminan</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
