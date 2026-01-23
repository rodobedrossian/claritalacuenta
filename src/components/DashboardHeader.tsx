import { RefreshCw, ChevronLeft, ChevronRight, Plus, Mic, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
}: DashboardHeaderProps) => {
  const isPositive = netBalance >= 0;

  return (
    <header className="bg-gradient-to-b from-card to-background border-b border-border/50">
      <div className="container mx-auto px-4 pt-4 pb-6">
        {/* Top row - Welcome & Exchange Rate */}
        <div className="flex items-center justify-between mb-4 pl-10 md:pl-0">
          <div>
            <p className="text-sm text-muted-foreground">
              Hola, <span className="font-medium text-foreground">{userName?.split(' ')[0] || 'Usuario'}</span>
            </p>
          </div>
          {lastUpdated && (
            <button
              onClick={onRefreshRate}
              disabled={isRefreshingRate}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <span className="font-medium">USD {exchangeRate.toFixed(0)}</span>
              <RefreshCw className={`h-3 w-3 ${isRefreshingRate ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Main Balance */}
        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Balance Neto</p>
          <p className={`text-4xl font-bold tracking-tight ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(netBalance, "ARS")}
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={onCurrentMonth}
            className="px-4 py-1.5 text-sm font-medium capitalize bg-muted/50 rounded-full hover:bg-muted transition-colors min-w-[140px]"
          >
            {format(activeMonth, "MMMM yyyy", { locale: es })}
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
