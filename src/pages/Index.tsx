import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { TransactionsList } from "@/components/TransactionsList";
import { SpendingChart } from "@/components/SpendingChart";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

const CATEGORIES = [
  "Groceries",
  "Utilities",
  "Rent",
  "Entertainment",
  "Transportation",
  "Healthcare",
  "Shopping",
  "Dining",
  "Salary",
  "Freelance",
  "Investment",
  "Other",
];

const Index = () => {
  const [currentSavings, setCurrentSavings] = useState(15000);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "income",
      amount: 5000,
      category: "Salary",
      description: "Monthly salary",
      date: new Date().toISOString(),
    },
    {
      id: "2",
      type: "expense",
      amount: 1200,
      category: "Rent",
      description: "Monthly rent payment",
      date: new Date().toISOString(),
    },
  ]);

  const handleAddTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions([newTransaction, ...transactions]);
    
    if (transaction.type === "income") {
      setCurrentSavings(currentSavings + transaction.amount);
    } else {
      setCurrentSavings(currentSavings - transaction.amount);
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const spendingByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const existing = acc.find((item) => item.category === t.category);
      if (existing) {
        existing.amount += t.amount;
      } else {
        acc.push({ category: t.category, amount: t.amount });
      }
      return acc;
    }, [] as Array<{ category: string; amount: number }>)
    .sort((a, b) => b.amount - a.amount);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">FinanceFlow</h1>
            </div>
            <AddTransactionDialog onAdd={handleAddTransaction} categories={CATEGORIES} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
          <StatCard
            title="Current Savings"
            value={formatCurrency(currentSavings)}
            icon={PiggyBank}
          />
          <StatCard
            title="Total Income"
            value={formatCurrency(totalIncome)}
            change="+12.5% from last month"
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            change="-8.2% from last month"
            icon={TrendingDown}
            trend="down"
          />
          <StatCard
            title="Net Balance"
            value={formatCurrency(totalIncome - totalExpenses)}
            icon={Wallet}
          />
        </div>

        {/* Charts and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          <SpendingChart data={spendingByCategory} />
          <TransactionsList transactions={transactions} />
        </div>
      </main>
    </div>
  );
};

export default Index;
