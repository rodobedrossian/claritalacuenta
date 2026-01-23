import { Pencil, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCategoryIcon, getCategoryColor, DEFAULT_CATEGORY_COLORS, DEFAULT_CATEGORY_ICONS } from "@/lib/categoryIcons";
import { motion } from "framer-motion";

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
  groupByDate?: boolean;
}

type DateGroup = {
  label: string;
  transactions: Transaction[];
  totals: {
    incomeARS: number;
    expenseARS: number;
    incomeUSD: number;
    expenseUSD: number;
  };
};

const getDateGroup = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  
  // Calculate days difference
  const diffTime = todayOnly.getTime() - dateOnly.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Hoy";
  }
  if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Ayer";
  }
  if (diffDays <= 7) {
    return "Esta semana";
  }
  if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
    return "Este mes";
  }
  
  // Return month and year for older transactions
  return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
};

const groupTransactionsByDate = (transactions: Transaction[]): DateGroup[] => {
  const groups: Map<string, Transaction[]> = new Map();
  const groupOrder: string[] = [];
  
  for (const transaction of transactions) {
    const groupLabel = getDateGroup(transaction.date);
    
    if (!groups.has(groupLabel)) {
      groups.set(groupLabel, []);
      groupOrder.push(groupLabel);
    }
    
    groups.get(groupLabel)!.push(transaction);
  }
  
  return groupOrder.map(label => {
    const groupTransactions = groups.get(label)!;
    const totals = groupTransactions.reduce(
      (acc, t) => {
        if (t.type === "income") {
          if (t.currency === "ARS") acc.incomeARS += t.amount;
          else acc.incomeUSD += t.amount;
        } else {
          if (t.currency === "ARS") acc.expenseARS += t.amount;
          else acc.expenseUSD += t.amount;
        }
        return acc;
      },
      { incomeARS: 0, expenseARS: 0, incomeUSD: 0, expenseUSD: 0 }
    );
    
    return {
      label,
      transactions: groupTransactions,
      totals
    };
  });
};

export const TransactionsList = ({ 
  transactions, 
  onEdit, 
  showViewAll, 
  onViewAll,
  showCard = true,
  groupByDate = true
}: TransactionsListProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getIconAndColor = (transaction: Transaction) => {
    const categoryName = transaction.categoryName || transaction.category;
    const iconName = transaction.categoryIcon || DEFAULT_CATEGORY_ICONS[categoryName] || "circle";
    const color = transaction.categoryColor || DEFAULT_CATEGORY_COLORS[categoryName] || "#6366f1";
    return { iconName, color };
  };

  const renderTransaction = (transaction: Transaction, showDate: boolean = true) => {
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
            {categoryDisplay}{showDate && ` · ${formatDate(transaction.date)}`}
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
            {transaction.currency} {formatAmount(transaction.amount)}
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
  };

  const renderGroupTotals = (totals: DateGroup['totals']) => {
    const parts: string[] = [];
    
    // Show expenses (negative)
    if (totals.expenseARS > 0) {
      parts.push(`-ARS ${formatAmount(totals.expenseARS)}`);
    }
    if (totals.expenseUSD > 0) {
      parts.push(`-USD ${formatAmount(totals.expenseUSD)}`);
    }
    
    // Show income (positive)
    if (totals.incomeARS > 0) {
      parts.push(`+ARS ${formatAmount(totals.incomeARS)}`);
    }
    if (totals.incomeUSD > 0) {
      parts.push(`+USD ${formatAmount(totals.incomeUSD)}`);
    }
    
    if (parts.length === 0) return null;
    
    return (
      <span className="text-xs text-muted-foreground tabular-nums">
        {parts.join(" · ")}
      </span>
    );
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
      
      {transactions.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Sin transacciones aún. ¡Agregá la primera!
        </p>
      ) : groupByDate ? (
        <div className="space-y-4">
          {groupTransactionsByDate(transactions).map((group, groupIndex) => (
            <div key={group.label}>
              {/* Group Header */}
              <div className="flex items-center gap-3 px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              
              {/* Group Transactions */}
              <div className="space-y-0.5">
                {group.transactions.map((transaction) => 
                  renderTransaction(transaction, group.label !== "Hoy" && group.label !== "Ayer")
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {transactions.map((transaction) => renderTransaction(transaction))}
        </div>
      )}
    </>
  );

  if (showCard) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="p-4 md:p-6 gradient-card border-border/50">
          {content}
        </Card>
      </motion.div>
    );
  }

  return <div>{content}</div>;
};
