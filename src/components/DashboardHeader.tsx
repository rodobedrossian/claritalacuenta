import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
  userName: string;
  exchangeRate: number;
  lastUpdated: string | null;
  isRefreshingRate: boolean;
  onRefreshRate: () => void;
  activeMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  netBalance: number;
  netBalanceBreakdown?: { usd: number; ars: number };
  formatCurrency: (amount: number, currency: "USD" | "ARS") => string;
}

export const DashboardHeader = ({
  userName,
  exchangeRate,
  lastUpdated,
  isRefreshingRate,
  onRefreshRate,
  activeMonth,
  onPreviousMonth,
  onNextMonth,
  onCurrentMonth,
  netBalance,
  netBalanceBreakdown,
  formatCurrency,
}: DashboardHeaderProps) => {
  const isPositive = netBalance >= 0;

  // Format breakdown subtitle
  const getBreakdownText = () => {
    if (!netBalanceBreakdown) return null;
    const { usd, ars } = netBalanceBreakdown;
    const parts: string[] = [];
    if (usd !== 0) parts.push(`USD ${usd >= 0 ? '' : '-'}${Math.abs(usd).toLocaleString('en-US')}`);
    if (ars !== 0) parts.push(`ARS ${ars >= 0 ? '' : '-'}${Math.abs(ars).toLocaleString('en-US')}`);
    return parts.length > 0 ? `(${parts.join(' + ')})` : null;
  };

  const breakdownText = getBreakdownText();

  return (
    <header className="bg-background transition-all duration-300">
      <div className="container mx-auto px-4 pt-2 pb-8">
        {/* Exchange Rate row - more subtle */}
        {lastUpdated && (
          <motion.div 
            className="flex items-center justify-end mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={onRefreshRate}
              disabled={isRefreshingRate}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <span className="font-semibold">USD {exchangeRate.toFixed(0)}</span>
              <RefreshCw className={`h-2.5 w-2.5 ${isRefreshingRate ? 'animate-spin' : ''}`} />
            </button>
          </motion.div>
        )}

        {/* Main Balance - Enhanced hierarchy */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-[0.2em] font-bold">Balance Neto</p>
          <motion.p 
            className={`text-5xl font-black tracking-tight ${isPositive ? 'text-success' : 'text-destructive'}`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {formatCurrency(netBalance, "ARS")}
          </motion.p>
          {breakdownText && (
            <motion.p 
              className="text-[11px] font-medium text-muted-foreground mt-2 opacity-80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.4 }}
            >
              {breakdownText}
            </motion.p>
          )}
        </motion.div>

        {/* Month Selector - Pill style */}
        <motion.div 
          className="flex items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted" onClick={onPreviousMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <button
            onClick={onCurrentMonth}
            className="px-6 py-2 text-sm font-bold capitalize bg-muted rounded-full hover:bg-muted/80 transition-all active:scale-95 shadow-sm"
          >
            {format(activeMonth, "MMMM yyyy", { locale: es })}
          </button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted" onClick={onNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </header>
  );
};
