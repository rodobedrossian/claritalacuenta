import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthlyAnalyticsChart } from "./MonthlyAnalyticsChart";
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

interface MonthlyDetailViewProps {
  month: string;
  transactions: CreditCardTransaction[];
  categories: Category[];
  creditCards: CreditCardType[];
  loading: boolean;
  onBack: () => void;
}

export const MonthlyDetailView = ({
  month,
  transactions,
  categories,
  creditCards,
  loading,
  onBack,
}: MonthlyDetailViewProps) => {
  // Get unique card IDs from transactions
  const uniqueCardIds = useMemo(() => {
    const ids = new Set<string>();
    transactions.forEach((t) => {
      if (t.credit_card_id) ids.add(t.credit_card_id);
    });
    return Array.from(ids);
  }, [transactions]);

  // Calculate totals
  const totals = useMemo(() => {
    const ars = transactions
      .filter((t) => t.currency === "ARS")
      .reduce((sum, t) => sum + t.amount, 0);
    const usd = transactions
      .filter((t) => t.currency === "USD")
      .reduce((sum, t) => sum + t.amount, 0);
    return { ars, usd };
  }, [transactions]);

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">
          Cargando transacciones...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Fixed sticky with safe area */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pt-safe pb-3 transition-all duration-300">
        <div className="flex items-center gap-4 h-10">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight capitalize">
              {format(parseISO(month), "MMMM yyyy", { locale: es })}
            </h1>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-2">
        {/* Summary stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xl md:text-2xl font-bold text-warning">
              {formatCurrency(totals.ars, "ARS")}
            </div>
            <p className="text-xs text-muted-foreground">Total en pesos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xl md:text-2xl font-bold text-warning">
              {formatCurrency(totals.usd, "USD")}
            </div>
            <p className="text-xs text-muted-foreground">Total en dólares</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xl md:text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">Transacciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xl md:text-2xl font-bold">{uniqueCardIds.length}</div>
            <p className="text-xs text-muted-foreground">Tarjetas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <MonthlyAnalyticsChart
        transactions={transactions}
        categories={categories}
        creditCards={creditCards}
      />

      </div>
    </div>
  );
};
