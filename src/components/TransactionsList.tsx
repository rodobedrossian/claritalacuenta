import { ArrowDownCircle, ArrowUpCircle, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: "USD" | "ARS";
  category: string;
  description: string;
  date: string;
  user_id: string;
}

interface TransactionsListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export const TransactionsList = ({ transactions, onEdit, showViewAll, onViewAll }: TransactionsListProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatAmount = (amount: number, currency: "USD" | "ARS") => {
    return `${currency} ${new Intl.NumberFormat("en-US").format(amount)}`;
  };

  return (
    <Card className="p-6 gradient-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        {showViewAll && onViewAll && (
          <Button variant="ghost" onClick={onViewAll} className="text-sm">
            View All →
          </Button>
        )}
      </div>
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No transactions yet. Add your first one!
          </p>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-smooth group"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`p-2 rounded-lg ${
                    transaction.type === "income"
                      ? "bg-success/10 border border-success/20"
                      : "bg-destructive/10 border border-destructive/20"
                  }`}
                >
                  {transaction.type === "income" ? (
                    <ArrowUpCircle className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.category} • {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p
                  className={`font-semibold ${
                    transaction.type === "income" ? "text-success" : "text-destructive"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatAmount(transaction.amount, transaction.currency)}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onEdit(transaction)}
                  title="Edit transaction"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
