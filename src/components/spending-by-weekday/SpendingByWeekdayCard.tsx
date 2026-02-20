import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpendingByWeekday, type WeekdayData, type CategoryAmount } from "@/hooks/useSpendingByWeekday";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SpendingByWeekdayCardProps {
  workspaceId: string | null;
}

function formatAmount(value: number, currency: string): string {
  const opts: Intl.NumberFormatOptions =
    currency === "USD"
      ? { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }
      : { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 };
  return new Intl.NumberFormat("es-AR", opts).format(value);
}

function formatTotalARS(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function SpendingByWeekdayCard({ workspaceId }: SpendingByWeekdayCardProps) {
  const [days, setDays] = useState<30 | 60>(30);
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);

  const { data, loading, error } = useSpendingByWeekday(days, workspaceId);

  const byWeekday = data?.byWeekday ?? [];
  const maxTotal = byWeekday.length
    ? Math.max(...byWeekday.map((d) => d.total), 1)
    : 1;
  const selectedData: WeekdayData | undefined =
    selectedWeekday !== null ? byWeekday[selectedWeekday] : undefined;

  if (error) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="p-6 bg-card border-border/30 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">¿Cuándo gastás?</h3>
          <div className="flex gap-2">
            <Button
              variant={days === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(30)}
              className={days === 30 ? "gradient-primary" : ""}
            >
              Últimos 30 días
            </Button>
            <Button
              variant={days === 60 ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(60)}
              className={days === 60 ? "gradient-primary" : ""}
            >
              Últimos 60 días
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : byWeekday.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">
            No hay gastos en el período seleccionado.
          </p>
        ) : (
          <>
            <div
              className="grid grid-cols-7 gap-2 mb-4"
              role="list"
              aria-label="Gastos por día de la semana"
            >
              {byWeekday.map((day) => (
                <button
                  key={day.weekday}
                  type="button"
                  onClick={() =>
                    setSelectedWeekday(selectedWeekday === day.weekday ? null : day.weekday)
                  }
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-left min-w-0",
                    "hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    selectedWeekday === day.weekday
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border/50 bg-card"
                  )}
                  role="listitem"
                  aria-pressed={selectedWeekday === day.weekday}
                  aria-label={`${day.label}: ${formatTotalARS(day.total)}. Click para ver categorías`}
                >
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {day.label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums truncate w-full text-center">
                    {day.total > 0 ? formatTotalARS(day.total) : "–"}
                  </span>
                  {maxTotal > 0 && day.total > 0 && (
                    <div
                      className="w-full h-1 rounded-full bg-muted overflow-hidden"
                      aria-hidden
                    >
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.max(8, (day.total / maxTotal) * 100)}%` }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {selectedData && selectedData.byCategory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 border-t border-border/50"
              >
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Categorías los {selectedData.label}
                </p>
                <ul className="space-y-2" role="list">
                  {selectedData.byCategory.map((item: CategoryAmount) => (
                    <li
                      key={`${item.categoryName}-${item.currency}`}
                      className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-muted/40"
                    >
                      <span className="text-sm truncate">{item.categoryName}</span>
                      <span className="text-sm font-medium tabular-nums shrink-0">
                        {formatAmount(item.amount, item.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {selectedData && selectedData.byCategory.length === 0 && (
              <p className="text-sm text-muted-foreground pt-4 border-t border-border/50">
                No hay gastos por categoría los {selectedData.label}.
              </p>
            )}
          </>
        )}
      </Card>
    </motion.div>
  );
}
