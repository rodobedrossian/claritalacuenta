import { useState, useEffect, useMemo } from "react";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatementImport, MonthlyTotals } from "@/hooks/useCreditCardStatements";
import { MonthlyStatementsSummary } from "./MonthlyStatementsSummary";

interface MonthlyGroup {
  month: string;
  statements: StatementImport[];
  totalArs: number;
  totalUsd: number;
  totalTransactions: number;
  cardIds: Set<string>;
}

interface StatementsListProps {
  statements: StatementImport[];
  creditCards: { id: string; name: string; bank: string | null }[];
  onSelectStatement: (statement: StatementImport) => void;
  onDeleteStatement: (statementId: string) => Promise<boolean>;
  onViewMonthlyAnalytics: (month: string) => void;
  getMonthlyTotals: () => Promise<MonthlyTotals[]>;
}

// Helper function to group statements by month (structure only, not totals)
function groupStatementsByMonth(statements: StatementImport[]): MonthlyGroup[] {
  const groups = new Map<string, MonthlyGroup>();

  statements.forEach((statement) => {
    const monthKey = statement.statement_month.substring(0, 7) + "-01";

    if (!groups.has(monthKey)) {
      groups.set(monthKey, {
        month: monthKey,
        statements: [],
        totalArs: 0,
        totalUsd: 0,
        totalTransactions: 0,
        cardIds: new Set(),
      });
    }

    const group = groups.get(monthKey)!;
    group.statements.push(statement);
    if (statement.credit_card_id) {
      group.cardIds.add(statement.credit_card_id);
    }
  });

  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.month).getTime() - new Date(a.month).getTime()
  );
}

export const StatementsList = ({ 
  statements, 
  creditCards, 
  onSelectStatement,
  onDeleteStatement,
  onViewMonthlyAnalytics,
  getMonthlyTotals,
}: StatementsListProps) => {
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals[]>([]);
  const [loadingTotals, setLoadingTotals] = useState(true);

  // Fetch real totals from database
  useEffect(() => {
    const fetchTotals = async () => {
      setLoadingTotals(true);
      try {
        const totals = await getMonthlyTotals();
        setMonthlyTotals(totals);
      } catch (error) {
        console.error("Error fetching monthly totals:", error);
      } finally {
        setLoadingTotals(false);
      }
    };
    
    if (statements.length > 0) {
      fetchTotals();
    } else {
      setLoadingTotals(false);
    }
  }, [statements, getMonthlyTotals]);

  // Group statements by month and apply real totals
  const monthlyGroups = useMemo(() => {
    const groups = groupStatementsByMonth(statements);
    
    // Apply real totals from database to each group
    groups.forEach(group => {
      const realTotals = monthlyTotals.find(t => t.month === group.month);
      if (realTotals) {
        group.totalArs = realTotals.totalArs;
        group.totalUsd = realTotals.totalUsd;
        group.totalTransactions = realTotals.transactionCount;
        // Merge card IDs from real transactions
        realTotals.cardIds.forEach(id => group.cardIds.add(id));
      }
    });
    
    return groups;
  }, [statements, monthlyTotals]);

  if (statements.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay resúmenes importados</p>
        <p className="text-sm text-muted-foreground mt-1">
          Importá un resumen desde el Dashboard para comenzar
        </p>
      </Card>
    );
  }

  if (loadingTotals) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Calculando totales...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {monthlyGroups.map((group) => (
        <MonthlyStatementsSummary
          key={group.month}
          group={group}
          creditCards={creditCards}
          onViewAnalytics={onViewMonthlyAnalytics}
          onSelectStatement={onSelectStatement}
        />
      ))}
    </div>
  );
};