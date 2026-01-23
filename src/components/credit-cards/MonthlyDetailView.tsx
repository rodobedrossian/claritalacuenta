import { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CreditCard, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [cardFilter, setCardFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Build maps
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const cardMap = useMemo(() => {
    const map = new Map<string, string>();
    creditCards.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [creditCards]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Card filter
      if (cardFilter !== "all" && t.credit_card_id !== cardFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== "all" && t.category_id !== categoryFilter) {
        return false;
      }
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return t.description.toLowerCase().includes(query);
      }
      return true;
    });
  }, [transactions, cardFilter, categoryFilter, searchQuery]);

  // Get unique card IDs from transactions
  const uniqueCardIds = useMemo(() => {
    const ids = new Set<string>();
    transactions.forEach((t) => {
      if (t.credit_card_id) ids.add(t.credit_card_id);
    });
    return Array.from(ids);
  }, [transactions]);

  // Get unique category IDs from transactions
  const uniqueCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    transactions.forEach((t) => {
      if (t.category_id) ids.add(t.category_id);
    });
    return Array.from(ids);
  }, [transactions]);

  // Calculate totals
  const totals = useMemo(() => {
    const ars = filteredTransactions
      .filter((t) => t.currency === "ARS")
      .reduce((sum, t) => sum + t.amount, 0);
    const usd = filteredTransactions
      .filter((t) => t.currency === "USD")
      .reduce((sum, t) => sum + t.amount, 0);
    return { ars, usd };
  }, [filteredTransactions]);

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yy", { locale: es });
    } catch {
      return dateStr;
    }
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
      {/* Header */}
      <div className="flex items-center gap-4">
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(totals.ars, "ARS")}
            </div>
            <p className="text-xs text-muted-foreground">Total en pesos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(totals.usd, "USD")}
            </div>
            <p className="text-xs text-muted-foreground">Total en dólares</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
            <p className="text-xs text-muted-foreground">Transacciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{uniqueCardIds.length}</div>
            <p className="text-xs text-muted-foreground">Tarjetas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <MonthlyAnalyticsChart
        transactions={filteredTransactions}
        categories={categories}
        creditCards={creditCards}
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Transacciones del mes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transacción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={cardFilter} onValueChange={setCardFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tarjeta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tarjetas</SelectItem>
                {uniqueCardIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {cardMap.get(id) || "Sin tarjeta"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {uniqueCategoryIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {categoryMap.get(id) || "Sin categoría"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transactions table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tarjeta</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay transacciones que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.slice(0, 100).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">
                        {formatDate(t.date)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px] truncate" title={t.description}>
                          {t.description}
                        </div>
                        {t.installment_current && t.installment_total && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Cuota {t.installment_current}/{t.installment_total}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {t.credit_card_id ? cardMap.get(t.credit_card_id) || "—" : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {t.category_id ? categoryMap.get(t.category_id) || "Sin categoría" : "Sin categoría"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(t.amount, t.currency)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {filteredTransactions.length > 100 && (
              <div className="p-3 text-center text-sm text-muted-foreground border-t">
                Mostrando 100 de {filteredTransactions.length} transacciones
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
