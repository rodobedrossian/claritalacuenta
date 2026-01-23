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
      {/* Header - with mobile margin to avoid menu button overlap */}
      <div className="flex items-center gap-4 ml-12 md:ml-0">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold capitalize">
            {format(parseISO(month), "MMMM yyyy", { locale: es })}
          </h1>
          <p className="text-muted-foreground">
            Analíticas consolidadas de {transactions.length} transacciones
          </p>
        </div>
      </div>

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
  );
};
