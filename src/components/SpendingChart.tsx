import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

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
    }));

  const formatAmount = (value: number) => {
    return `${currency} ${new Intl.NumberFormat("es-AR").format(value)}`;
  };

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
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="amount"
              nameKey="category"
              label={({ category, percent }) => 
                `${category} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={false}
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
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [formatAmount(value), "Monto"]}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};