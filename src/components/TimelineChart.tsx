import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: "USD" | "ARS";
  date: string;
}

interface TimelineChartProps {
  transactions: Transaction[];
}

export const TimelineChart = ({ transactions }: TimelineChartProps) => {
  const [currency, setCurrency] = useState<"USD" | "ARS">("USD");

  // Filter transactions by currency and group by date
  const timelineData = transactions
    .filter(t => t.currency === currency)
    .reduce((acc, transaction) => {
      const date = format(parseISO(transaction.date), "dd MMM", { locale: es });
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        if (transaction.type === "income") {
          existing.income += transaction.amount;
        } else {
          existing.expenses += transaction.amount;
        }
      } else {
        acc.push({
          date,
          income: transaction.type === "income" ? transaction.amount : 0,
          expenses: transaction.type === "expense" ? transaction.amount : 0,
        });
      }
      
      return acc;
    }, [] as Array<{ date: string; income: number; expenses: number }>)
    .sort((a, b) => {
      // Sort by date chronologically
      const dateA = new Date(a.date + " 2024");
      const dateB = new Date(b.date + " 2024");
      return dateA.getTime() - dateB.getTime();
    });

  return (
    <Card className="p-6 gradient-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Ingresos vs Gastos</h3>
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
      {timelineData.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Sin datos aún. ¡Empezá a registrar tus transacciones!
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
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
            <Legend />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="hsl(var(--success))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--success))" }}
              name="Ingresos"
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--destructive))" }}
              name="Gastos"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};