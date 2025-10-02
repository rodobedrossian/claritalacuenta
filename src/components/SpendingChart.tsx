import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SpendingChartProps {
  data: Array<{
    category: string;
    amount: number;
  }>;
}

export const SpendingChart = ({ data }: SpendingChartProps) => {
  const [currency, setCurrency] = useState<"USD" | "ARS">("USD");

  // Filter data by selected currency
  const filteredData = data
    .filter(item => item.category.includes(`(${currency})`))
    .map(item => ({
      category: item.category.replace(` (${currency})`, ''),
      amount: item.amount
    }));

  return (
    <Card className="p-6 gradient-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Spending by Category</h3>
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
          No data yet. Start tracking your expenses!
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="category" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar 
              dataKey="amount" 
              fill="hsl(var(--primary))" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};
