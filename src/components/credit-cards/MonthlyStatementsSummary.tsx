import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CreditCard, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatementImport } from "@/hooks/useCreditCardStatements";
import { useState } from "react";

interface CreditCardType {
  id: string;
  name: string;
  bank: string | null;
}

interface MonthlyGroup {
  month: string; // YYYY-MM-DD format
  statements: StatementImport[];
  totalArs: number;
  totalUsd: number;
  totalTransactions: number;
  cardIds: Set<string>;
}

interface MonthlyStatementsSummaryProps {
  group: MonthlyGroup;
  creditCards: CreditCardType[];
  onViewAnalytics: (month: string) => void;
  onSelectStatement: (statement: StatementImport) => void;
  children?: React.ReactNode;
}

export const MonthlyStatementsSummary = ({
  group,
  creditCards,
  onViewAnalytics,
  onSelectStatement,
  children,
}: MonthlyStatementsSummaryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCardName = (cardId: string) => {
    const card = creditCards.find((c) => c.id === cardId);
    return card ? card.name : "Tarjeta";
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const cardNames = Array.from(group.cardIds).map((id) => getCardName(id));

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            {/* Month header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-semibold capitalize">
                {format(parseISO(group.month), "MMMM yyyy", { locale: es })}
              </span>
              <Badge variant="secondary" className="text-xs">
                {group.statements.length} resumen{group.statements.length !== 1 ? "es" : ""}
              </Badge>
            </div>

            {/* Cards badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {cardNames.map((name, idx) => (
                <Badge key={idx} variant="outline" className="gap-1">
                  <CreditCard className="h-3 w-3" />
                  {name}
                </Badge>
              ))}
            </div>

            {/* Totals */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {group.totalArs > 0 && (
                <span className="font-semibold text-warning">
                  {formatCurrency(group.totalArs, "ARS")}
                </span>
              )}
              {group.totalUsd > 0 && (
                <span className="font-semibold text-warning">
                  {formatCurrency(group.totalUsd, "USD")}
                </span>
              )}
              <span className="text-muted-foreground">
                {group.totalTransactions} transacciones
              </span>
            </div>
          </div>

          {/* Actions - responsive layout */}
          <div className="flex items-center gap-2 self-start">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onViewAnalytics(group.month)}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Ver analíticas</span>
              <span className="sm:hidden">Analíticas</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Ocultar</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span className="hidden sm:inline">Ver resúmenes</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Expanded: show individual statements */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-2">
            {group.statements.map((statement) => {
              const extractedData = statement.extracted_data;
              const totalArs = extractedData?.resumen?.total_ars || 0;
              const totalUsd = extractedData?.resumen?.total_usd || 0;

              return (
                <div
                  key={statement.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => onSelectStatement(statement)}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {getCardName(statement.credit_card_id || "")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {statement.transactions_created} transacciones
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {totalArs > 0 && (
                      <span className="text-warning font-medium">
                        {formatCurrency(totalArs, "ARS")}
                      </span>
                    )}
                    {totalUsd > 0 && (
                      <span className="text-warning font-medium">
                        {formatCurrency(totalUsd, "USD")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {children}
      </CardContent>
    </Card>
  );
};

