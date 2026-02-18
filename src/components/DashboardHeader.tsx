import { RefreshCw, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

interface CurrencyBreakdown {
  usd: number;
  ars: number;
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
  formatCurrency: (amount: number, currency: "USD" | "ARS") => string;
  income: CurrencyBreakdown;
  expenses: CurrencyBreakdown;
  liquidSavings: CurrencyBreakdown;
  totalInvested: CurrencyBreakdown;
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
  formatCurrency,
  income,
  expenses,
  liquidSavings,
  totalInvested,
}: DashboardHeaderProps) => {

  const formatCompact = (amount: number, currency: "USD" | "ARS") => {
    return `${currency} ${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(amount)}`;
  };

  const incomeTotal = (income.usd * exchangeRate) + income.ars;
  const expensesTotal = (expenses.usd * exchangeRate) + expenses.ars;

  const hasInvestments = totalInvested.usd > 0 || totalInvested.ars > 0;
  const hasLiquid = liquidSavings.usd > 0 || liquidSavings.ars > 0;

  return (
    <header className="relative overflow-hidden rounded-b-3xl" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
      
      <div className="relative container mx-auto px-4 pt-3 pb-5">
        {/* Exchange Rate chip */}
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
          <p className="text-[11px] text-white/60 mb-1 uppercase tracking-[0.2em] font-bold">Balance Neto</p>
          <motion.p 
            className="text-4xl font-black tracking-tight text-white"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {formatCurrency(netBalance, "ARS")}
          </motion.p>
        </motion.div>

        {/* Income & Expenses row */}
        <motion.div 
          className="grid grid-cols-2 gap-2 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          {/* Income */}
          <div className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-2xl bg-white/8 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-full bg-white/10">
                <TrendingUp className="h-3 w-3 text-emerald-300" />
              </div>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Ingresos</p>
            </div>
            <p className="text-base font-bold text-emerald-300">{formatCompact(incomeTotal, "ARS")}</p>
            <div className="flex flex-col items-center gap-0.5">
              {income.usd > 0 && <p className="text-[11px] text-white/70">USD {income.usd.toLocaleString('en-US')}</p>}
              {income.ars > 0 && <p className="text-[11px] text-white/70">ARS {income.ars.toLocaleString('en-US')}</p>}
            </div>
          </div>

          {/* Expenses */}
          <div className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-2xl bg-white/8 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-full bg-white/10">
                <TrendingDown className="h-3 w-3 text-red-300" />
              </div>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Gastos</p>
            </div>
            <p className="text-base font-bold text-red-300">{formatCompact(expensesTotal, "ARS")}</p>
            <div className="flex flex-col items-center gap-0.5">
              {expenses.usd > 0 && <p className="text-[11px] text-white/70">USD {expenses.usd.toLocaleString('en-US')}</p>}
              {expenses.ars > 0 && <p className="text-[11px] text-white/70">ARS {expenses.ars.toLocaleString('en-US')}</p>}
            </div>
          </div>
        </motion.div>

        {/* Savings row - full width */}
        <motion.div 
          className="rounded-2xl bg-white/8 backdrop-blur-sm px-3 py-2.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <div className="p-1 rounded-full bg-white/10">
              <PiggyBank className="h-3 w-3 text-white" />
            </div>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Ahorros</p>
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {hasLiquid && (
              <div className="text-center">
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Líquidos</p>
                <div className="flex flex-col items-center">
                  {liquidSavings.usd > 0 && <p className="text-sm font-bold text-white">USD {liquidSavings.usd.toLocaleString('en-US')}</p>}
                  {liquidSavings.ars > 0 && <p className="text-sm font-bold text-white">ARS {liquidSavings.ars.toLocaleString('en-US')}</p>}
                </div>
              </div>
            )}
            {hasLiquid && hasInvestments && <div className="h-6 w-px bg-white/15" />}
            {hasInvestments && (
              <div className="text-center">
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Invertidos</p>
                <div className="flex flex-col items-center">
                  {totalInvested.usd > 0 && <p className="text-sm font-bold text-white">USD {totalInvested.usd.toLocaleString('en-US')}</p>}
                  {totalInvested.ars > 0 && <p className="text-sm font-bold text-white">ARS {totalInvested.ars.toLocaleString('en-US')}</p>}
                </div>
              </div>
            )}
            {!hasLiquid && !hasInvestments && (
              <p className="text-xs font-bold text-white/50">Sin ahorros</p>
            )}
          </div>
        </motion.div>
      </div>
    </header>
  );
};
