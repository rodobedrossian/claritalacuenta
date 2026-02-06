import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCardTransaction } from "@/hooks/useCreditCardStatements";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface CreditCardType {
  id: string;
  name: string;
  bank: string | null;
}

interface MonthlyAnalyticsChartProps {
  transactions: CreditCardTransaction[];
  categories: Category[];
  creditCards: CreditCardType[];
}

// Same colors as StatementSpendingChart for consistency
const COLORS = [
  "hsl(262, 83%, 58%)",
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(280, 87%, 65%)",
  "hsl(172, 66%, 50%)",
  "hsl(47, 100%, 50%)",
  "hsl(330, 81%, 60%)",
  "hsl(200, 98%, 39%)",
];

export const MonthlyAnalyticsChart = ({
  transactions,
  categories,
  creditCards,
}: MonthlyAnalyticsChartProps) => {
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");

  // Build category name map
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // Build card name map
  const cardMap = useMemo(() => {
    const map = new Map<string, string>();
    creditCards.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [creditCards]);

  // Calculate data by category (excluding adjustments to prevent pie chart distortion)
  const categoryData = useMemo(() => {
    const data = new Map<string, number>();

    transactions
      .filter((t) => t.currency === currency && t.transaction_type !== "ajuste")
      .forEach((t) => {
        const categoryName = t.category_id
          ? categoryMap.get(t.category_id) || "Sin categoría"
          : "Sin categoría";
        data.set(categoryName, (data.get(categoryName) || 0) + t.amount);
      });

    return Array.from(data.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, currency, categoryMap]);

  // Calculate data by card
  const cardData = useMemo(() => {
    const data = new Map<string, number>();

    transactions
      .filter((t) => t.currency === currency)
      .forEach((t) => {
        const cardName = t.credit_card_id
          ? cardMap.get(t.credit_card_id) || "Sin tarjeta"
          : "Sin tarjeta";
        data.set(cardName, (data.get(cardName) || 0) + t.amount);
      });

    return Array.from(data.entries())
      .map(([card, amount]) => ({ card, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, currency, cardMap]);

  // Check if we have both currencies
  const hasBothCurrencies = useMemo(() => {
    const currencies = new Set(transactions.map((t) => t.currency));
    return currencies.has("ARS") && currencies.has("USD");
  }, [transactions]);

  const total = categoryData.reduce((sum, d) => sum + d.amount, 0);

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatAmountShort = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No hay transacciones para mostrar
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Pie Chart by Category - Matching StatementSpendingChart style */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Gastos por Categoría</h3>
          {hasBothCurrencies && (
            <div className="flex gap-1">
              <Button
                variant={currency === "ARS" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrency("ARS")}
              >
                ARS
              </Button>
              <Button
                variant={currency === "USD" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrency("USD")}
              >
                USD
              </Button>
            </div>
          )}
        </div>

        {categoryData.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Donut Chart */}
            <div className="flex-shrink-0">
              <ResponsiveContainer width={240} height={240}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatAmount(value)}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full lg:w-auto">
              {/* Total */}
              <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-sm text-muted-foreground">Total consolidado</p>
                <p className="text-2xl font-bold">{formatAmount(total)}</p>
              </div>

              {/* Categories */}
              <div className="space-y-2 overflow-y-auto max-h-[180px]">
                {categoryData.map((item, index) => {
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
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-medium">
                          {formatAmount(item.amount)}
                        </span>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No hay datos en {currency}
          </div>
        )}
      </Card>

      {/* Bar Chart by Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gasto por Tarjeta</CardTitle>
        </CardHeader>
        <CardContent>
          {cardData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cardData} layout="vertical">
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatAmountShort(v)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="card"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload || !payload[0]) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg p-2 text-sm shadow-md">
                          <p className="font-medium">{data.card}</p>
                          <p className="text-muted-foreground">{formatAmount(data.amount)}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No hay datos en {currency}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};