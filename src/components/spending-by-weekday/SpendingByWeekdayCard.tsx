import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpendingByWeekday, type WeekdayData, type CategoryAmount } from "@/hooks/useSpendingByWeekday";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SpendingByWeekdayCardProps {
  workspaceId: string | null;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 10_000) {
    return `$${Math.round(value / 1000)}k`;
  }
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAmount(value: number, currency: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTotalARS(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const BAR_COLORS = [
  "bg-emerald-500",
  "bg-emerald-400",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
];

export function SpendingByWeekdayCard({ workspaceId }: SpendingByWeekdayCardProps) {
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);

  const { data, loading, error } = useSpendingByWeekday(60, workspaceId);

  const byWeekday = data?.byWeekday ?? [];
  const maxTotal = byWeekday.length
    ? Math.max(...byWeekday.map((d) => d.total), 1)
    : 1;
  const selectedData: WeekdayData | undefined =
    selectedWeekday !== null ? byWeekday[selectedWeekday] : undefined;

  if (error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="p-5 sm:p-6 bg-card border-border/30 rounded-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">¿Cuándo gastás más?</h3>
          <span className="text-xs text-muted-foreground">Últimos 60 días</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-xl" />
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-4 rounded" />
              ))}
            </div>
          </div>
        ) : byWeekday.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">
            No hay gastos en el período seleccionado.
          </p>
        ) : (
          <>
            {/* Bar chart */}
            <div
              className="flex items-end gap-1.5 sm:gap-3 mb-2"
              style={{ height: 120 }}
              role="list"
              aria-label="Gastos por día de la semana"
            >
              {byWeekday.map((day, i) => {
                const heightPct = maxTotal > 0 && day.total > 0
                  ? Math.max(8, (day.total / maxTotal) * 100)
                  : 4;
                const isSelected = selectedWeekday === day.weekday;
                const isHighest = day.total === maxTotal && day.total > 0;

                return (
                  <button
                    key={day.weekday}
                    type="button"
                    onClick={() =>
                      setSelectedWeekday(isSelected ? null : day.weekday)
                    }
                    className={cn(
                      "flex-1 flex flex-col items-center justify-end h-full rounded-lg transition-all",
                      "hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    )}
                    role="listitem"
                    aria-pressed={isSelected}
                    aria-label={`${day.label}: ${formatTotalARS(day.total)}`}
                  >
                    <motion.div
                      className={cn(
                        "w-full rounded-lg transition-colors",
                        isSelected
                          ? "bg-primary ring-2 ring-primary/30"
                          : isHighest
                            ? BAR_COLORS[i % BAR_COLORS.length]
                            : BAR_COLORS[i % BAR_COLORS.length] + " opacity-60"
                      )}
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                      style={{ minHeight: 4 }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Labels row */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-3 mb-1">
              {byWeekday.map((day) => (
                <div key={day.weekday} className="text-center">
                  <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Amounts row */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
              {byWeekday.map((day) => (
                <div key={day.weekday} className="text-center">
                  <span className="text-[10px] sm:text-xs font-semibold tabular-nums text-foreground/80">
                    {day.total > 0 ? formatCompact(day.total) : "–"}
                  </span>
                </div>
              ))}
            </div>

            {/* Category detail */}
            <AnimatePresence mode="wait">
              {selectedData && selectedData.byCategory.length > 0 && (
                <motion.div
                  key={selectedData.weekday}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 pt-4 border-t border-border/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Top categorías – {selectedData.label}
                    </p>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatTotalARS(selectedData.total)}
                    </p>
                  </div>
                  <ul className="space-y-1.5" role="list">
                    {selectedData.byCategory.slice(0, 5).map((item: CategoryAmount) => {
                      const pct = selectedData.total > 0
                        ? (item.amount / (item.currency === "USD" ? 1 : selectedData.total)) * 100
                        : 0;
                      return (
                        <li
                          key={`${item.categoryName}-${item.currency}`}
                          className="flex items-center gap-3 py-1.5 px-2 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm truncate">{item.categoryName}</span>
                              <span className="text-sm font-medium tabular-nums shrink-0 ml-2">
                                {formatAmount(item.amount, item.currency)}
                              </span>
                            </div>
                            {item.currency !== "USD" && (
                              <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary/50"
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            {selectedData && selectedData.byCategory.length === 0 && (
              <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
                No hay gastos por categoría los {selectedData.label}.
              </p>
            )}
          </>
        )}
      </Card>
    </motion.div>
  );
}
