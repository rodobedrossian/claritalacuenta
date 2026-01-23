import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatementImport } from "@/hooks/useCreditCardStatements";
import { 
  MonthlyStatementsSummary, 
  groupStatementsByMonth 
} from "./MonthlyStatementsSummary";
import { useMemo } from "react";

interface StatementsListProps {
  statements: StatementImport[];
  creditCards: { id: string; name: string; bank: string | null }[];
  onSelectStatement: (statement: StatementImport) => void;
  onDeleteStatement: (statementId: string) => Promise<boolean>;
  onViewMonthlyAnalytics: (month: string) => void;
}

export const StatementsList = ({ 
  statements, 
  creditCards, 
  onSelectStatement,
  onDeleteStatement,
  onViewMonthlyAnalytics,
}: StatementsListProps) => {
  // Group statements by month
  const monthlyGroups = useMemo(() => {
    return groupStatementsByMonth(statements);
  }, [statements]);

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
