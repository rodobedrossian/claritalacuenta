import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface SpendingChartProps {
  data: Array<{
    category: string;
    amount: number;
  }>;
}

// Colors for pie chart segments
const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--success))",
  "hsl(221 83% 53%)", // blue
  "hsl(280 65% 60%)", // purple
  "hsl(30 90% 55%)",  // orange
  "hsl(180 60% 45%)", // teal
  "hsl(340 75% 55%)", // pink
];

export const SpendingChart = ({ data }: SpendingChartProps) => {
  const [currency, setCurrency] = useState<"USD" | "ARS">("USD");

  // Filter data by selected currency
  const filteredData = data
    .filter(item => item.category.includes(`(${currency})`))
    .map(item => ({
      category: item.category.replace(` (${currency})`, ''),
      amount: item.amount
    }))
    .sort((a, b) => b.amount - a.amount); // Sort by amount descending

  const formatAmount = (value: number) => {
    return `${currency} ${new Intl.NumberFormat("es-AR").format(value)}`;
  };

  const total = filteredData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="p-6 gradient-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Gastos por Categoría</h3>
        <div className="flex gap-2">
          <Button
            variant={currency === "USD" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrency("USD")}
            className={currency === "USD" ? "gradient-primary" : ""}
          >
            USD
          </Button>
          <Button
            variant={currency === "ARS" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrency("ARS")}
            className={currency === "ARS" ? "gradient-primary" : ""}
          >
            ARS
          </Button>
        </div>
      </div>
      {filteredData.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Sin datos aún. ¡Empezá a registrar tus gastos!
        </p>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Pie Chart */}
          <div className="flex-shrink-0">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="category"
                >
                  {filteredData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    padding: "8px 12px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  formatter={(value: number, name: string) => [formatAmount(value), name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend as list */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[220px]">
            {filteredData.map((item, index) => {
              const percentage = ((item.amount / total) * 100).toFixed(1);
              return (
                <div 
                  key={item.category} 
                  className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm truncate" title={item.category}>
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-medium">
                      {formatAmount(item.amount)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};