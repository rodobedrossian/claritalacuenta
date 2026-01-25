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
    <header className="bg-background">
      <div className="container mx-auto px-4 pt-4 pb-6">
        {/* Exchange Rate row */}
        {lastUpdated && (
          <motion.div 
            className="flex items-center justify-end mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={onRefreshRate}
              disabled={isRefreshingRate}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <span className="font-medium">USD {exchangeRate.toFixed(0)}</span>
              <RefreshCw className={`h-3 w-3 ${isRefreshingRate ? 'animate-spin' : ''}`} />
            </button>
          </motion.div>
        )}

        {/* Main Balance */}
        <motion.div 
          className="text-center mb-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">Balance Neto</p>
          <motion.p 
            className={`text-4xl font-bold tracking-tight ${isPositive ? 'text-success' : 'text-destructive'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {formatCurrency(netBalance, "ARS")}
          </motion.p>
          {breakdownText && (
            <motion.p 
              className="text-xs text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              {breakdownText}
            </motion.p>
          )}
        </motion.div>

        {/* Month Selector */}
        <motion.div 
          className="flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={onPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={onCurrentMonth}
            className="px-4 py-1.5 text-sm font-medium capitalize bg-muted rounded-full hover:bg-muted/80 transition-colors min-w-[140px]"
          >
            {format(activeMonth, "MMMM yyyy", { locale: es })}
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </header>
  );
};
