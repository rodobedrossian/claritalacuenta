import { Pencil, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCategoryIcon, getCategoryColor, DEFAULT_CATEGORY_COLORS, DEFAULT_CATEGORY_ICONS } from "@/lib/categoryIcons";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: "USD" | "ARS";
  category: string;
  categoryName?: string;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  description: string;
  date: string;
  user_id: string;
  from_savings?: boolean;
  savings_source?: string;
}

interface TransactionsListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  showViewAll?: boolean;
  onViewAll?: () => void;
  showCard?: boolean;
}

export const TransactionsList = ({ 
  transactions, 
  onEdit, 
  showViewAll, 
  onViewAll,
  showCard = true 
}: TransactionsListProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return "Hoy";
    }
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer";
    }
    
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  };

  const formatAmount = (amount: number, currency: "USD" | "ARS") => {
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getIconAndColor = (transaction: Transaction) => {
    const categoryName = transaction.categoryName || transaction.category;
    
    // Try to get icon from transaction data, then fallback to defaults
    const iconName = transaction.categoryIcon || DEFAULT_CATEGORY_ICONS[categoryName] || "circle";
    const color = transaction.categoryColor || DEFAULT_CATEGORY_COLORS[categoryName] || "#6366f1";
    
    return { iconName, color };
  };

  const content = (
    <>
      {showCard && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Transacciones Recientes</h3>
          {showViewAll && onViewAll && (
            <Button variant="ghost" onClick={onViewAll} className="text-sm">
              Ver Todas →
            </Button>
          )}
        </div>
      )}
      <div className="space-y-1">
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Sin transacciones aún. ¡Agregá la primera!
          </p>
        ) : (
          transactions.map((transaction) => {
            const { iconName, color } = getIconAndColor(transaction);
            const IconComponent = getCategoryIcon(iconName);
            const categoryDisplay = transaction.categoryName || transaction.category;
            
            return (
              <div
                key={transaction.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                onClick={() => onEdit(transaction)}
              >
                {/* Category Icon */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <IconComponent 
                    className="w-5 h-5" 
                    style={{ color }} 
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium truncate text-sm">
                      {transaction.description}
                    </p>
                    {transaction.from_savings && (
                      <PiggyBank className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {categoryDisplay} · {formatDate(transaction.date)}
                  </p>
                </div>
                
                {/* Amount */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p
                    className={`font-semibold text-sm tabular-nums ${
                      transaction.type === "income" ? "text-success" : "text-foreground"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {transaction.currency} {formatAmount(transaction.amount, transaction.currency)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(transaction);
                    }}
                    title="Editar transacción"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );

  if (showCard) {
    return (
      <Card className="p-4 md:p-6 gradient-card border-border/50">
        {content}
      </Card>
    );
  }

  return <div>{content}</div>;
};
