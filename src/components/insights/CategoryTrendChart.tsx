import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Transaction {
  date: string;
  amount: number;
  currency: string;
  category: string;
}

interface CategoryTrendChartProps {
  transactions: Transaction[];
  category: string;
  exchangeRate: number;
}

export function CategoryTrendChart({
  transactions,
  category,
  exchangeRate,
}: CategoryTrendChartProps) {
  const chartData = useMemo(() => {
    // Filter by category and group by month
    const filtered = transactions.filter((tx) => tx.category === category);
    const monthlyData: Record<string, number> = {};

    filtered.forEach((tx) => {
      const month = tx.date.substring(0, 7);
      const amountInARS = tx.currency === "USD" ? tx.amount * exchangeRate : tx.amount;
      monthlyData[month] = (monthlyData[month] || 0) + amountInARS;
    });

    // Convert to array and sort
    return Object.entries(monthlyData)
      .map(([month, total]) => ({
        month,
        label: formatMonth(month),
        total,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions, category, exchangeRate]);

  const average = useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce((sum, d) => sum + d.total, 0) / chartData.length;
  }, [chartData]);

  if (chartData.length < 2) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Evolución de {category}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(value) => formatCompact(value)}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Total"]}
                labelFormatter={(label) => `Mes: ${label}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <ReferenceLine
                y={average}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                label={{
                  value: "Promedio",
                  position: "right",
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompact(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
}
