import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface StatementSpendingChartProps {
  items: Array<{
    descripcion: string;
    monto: number;
    moneda: string;
    category?: string;
  }>;
  itemCategories: Record<string, string>;
  categories: Category[];
}

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

export const StatementSpendingChart = ({
  items,
  itemCategories,
  categories,
}: StatementSpendingChartProps) => {
  const [selectedCurrency, setSelectedCurrency] = useState<"ARS" | "USD">("ARS");

  // Build category ID to name map
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(c => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // Calculate spending by category for items with categories
  const { chartData, total, hasBothCurrencies } = useMemo(() => {
    const categoryAmountMap = new Map<string, number>();
    let arsTotal = 0;
    let usdTotal = 0;

    items.forEach((item) => {
      // itemCategories is keyed by description for the new structure
      const categoryId = itemCategories[item.descripcion];
      // Look up category name, fallback to ID or "Sin categoría"
      const categoryName = categoryId 
        ? (categoryNameMap.get(categoryId) || categoryId) 
        : "Sin categoría";
      const currency = item.moneda || "ARS";

      if (currency === "ARS") arsTotal += item.monto;
      else usdTotal += item.monto;

      if (currency === selectedCurrency) {
        categoryAmountMap.set(categoryName, (categoryAmountMap.get(categoryName) || 0) + item.monto);
      }
    });

    const data = Array.from(categoryAmountMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      chartData: data,
      total: selectedCurrency === "ARS" ? arsTotal : usdTotal,
      hasBothCurrencies: arsTotal > 0 && usdTotal > 0,
    };
  }, [items, itemCategories, selectedCurrency, categoryNameMap]);

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: selectedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Gastos por Categoría</h3>
        {hasBothCurrencies && (
          <div className="flex gap-1">
            <Button
              variant={selectedCurrency === "ARS" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCurrency("ARS")}
            >
              ARS
            </Button>
            <Button
              variant={selectedCurrency === "USD" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCurrency("USD")}
            >
              USD
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* Pie Chart */}
        <div className="flex-shrink-0">
          <ResponsiveContainer width={240} height={240}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="amount"
                nameKey="category"
              >
                {chartData.map((_, index) => (
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
            <p className="text-sm text-muted-foreground">Total del resumen</p>
            <p className="text-2xl font-bold">{formatAmount(total)}</p>
          </div>

          {/* Categories */}
          <div className="space-y-2 overflow-y-auto max-h-[180px]">
            {chartData.map((item, index) => {
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
    </Card>
  );
};
