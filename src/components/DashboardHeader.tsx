import { RefreshCw, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

interface MiniStat {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  variant: "success" | "destructive" | "primary";
}

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
  miniStats?: MiniStat[];
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
  miniStats,
}: DashboardHeaderProps) => {
  const isPositive = netBalance >= 0;

  const getBreakdownText = () => {
    if (!netBalanceBreakdown) return null;
    const { usd, ars } = netBalanceBreakdown;
    const parts: string[] = [];
    if (usd !== 0) parts.push(`USD ${usd >= 0 ? '' : '-'}${Math.abs(usd).toLocaleString('en-US')}`);
    if (ars !== 0) parts.push(`ARS ${ars >= 0 ? '' : '-'}${Math.abs(ars).toLocaleString('en-US')}`);
    return parts.length > 0 ? `${parts.join(' + ')}` : null;
  };

  const breakdownText = getBreakdownText();

  const variantColors = {
    success: "text-emerald-300",
    destructive: "text-red-300",
    primary: "text-white",
  };

  const variantBg = {
    success: "bg-white/10",
    destructive: "bg-white/10",
    primary: "bg-white/10",
  };

  return (
    <header className="relative overflow-hidden rounded-b-3xl" style={{ background: "var(--gradient-hero)" }}>
      {/* Subtle decorative glow */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
      
      <div className="relative container mx-auto px-4 pt-3 pb-5">
        {/* Exchange Rate chip - top right */}
        {lastUpdated && (
          <motion.div 
            className="flex items-center justify-end mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={onRefreshRate}
              disabled={isRefreshingRate}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[10px] text-white/70 hover:text-white hover:bg-white/15 transition-colors disabled:opacity-50"
            >
              <span className="font-semibold">USD {exchangeRate.toFixed(0)}</span>
              <RefreshCw className={`h-2.5 w-2.5 ${isRefreshingRate ? 'animate-spin' : ''}`} />
            </button>
          </motion.div>
        )}

        {/* Month Selector */}
        <motion.div 
          className="flex items-center justify-center gap-2 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10" 
            onClick={onPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={onCurrentMonth}
            className="px-4 py-1.5 text-xs font-bold capitalize bg-white/10 rounded-full text-white/90 hover:bg-white/15 transition-all active:scale-95"
          >
            {format(activeMonth, "MMMM yyyy", { locale: es })}
          </button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10" 
            onClick={onNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Main Balance */}
        <motion.div 
          className="text-center mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[10px] text-white/50 mb-1 uppercase tracking-[0.2em] font-bold">Balance Neto</p>
          <motion.p 
            className="text-4xl font-black tracking-tight text-white"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {formatCurrency(netBalance, "ARS")}
          </motion.p>
          {breakdownText && (
            <motion.p 
              className="text-[11px] font-medium text-white/40 mt-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {breakdownText}
            </motion.p>
          )}
        </motion.div>

        {/* Mini Stats Row */}
        {miniStats && miniStats.length > 0 && (
          <motion.div 
            className="grid grid-cols-3 gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            {miniStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={stat.label}
                  className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-2xl bg-white/8 backdrop-blur-sm"
                >
                  <div className={`p-1.5 rounded-full ${variantBg[stat.variant]}`}>
                    <Icon className={`h-3.5 w-3.5 ${variantColors[stat.variant]}`} />
                  </div>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-sm font-bold ${variantColors[stat.variant]}`}>{stat.value}</p>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </header>
  );
};
