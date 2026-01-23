import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
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

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(210, 70%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(30, 80%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(340, 70%, 50%)",
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

  // Calculate data by category
  const categoryData = useMemo(() => {
    const data = new Map<string, number>();

    transactions
      .filter((t) => t.currency === currency)
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
      {/* Pie Chart by Category */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Gasto por Categoría</CardTitle>
            {hasBothCurrencies && (
              <div className="flex gap-1">
                <Button
                  variant={currency === "ARS" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCurrency("ARS")}
                >
                  ARS
                </Button>
                <Button
                  variant={currency === "USD" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCurrency("USD")}
                >
                  USD
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={false}
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `${currency} ${formatAmount(value)}`,
                        "Monto",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2 max-h-[150px] overflow-y-auto">
                {categoryData.slice(0, 6).map((item, index) => (
                  <div key={item.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate max-w-[120px]">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {currency} {formatAmount(item.amount)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {((item.amount / total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
                {categoryData.length > 6 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{categoryData.length - 6} categorías más
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No hay datos en {currency}
            </div>
          )}
        </CardContent>
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
                    tickFormatter={(v) => formatAmount(v)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="card"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${currency} ${formatAmount(value)}`,
                      "Monto",
                    ]}
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
