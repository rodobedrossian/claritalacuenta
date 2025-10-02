import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { TransactionsList } from "@/components/TransactionsList";
import { SpendingChart } from "@/components/SpendingChart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  user_id: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface DbTransaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  user_id: string;
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentSavings, setCurrentSavings] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Check authentication
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("name")
        .order("name");
      
      if (categoriesData) {
        setCategories(categoriesData.map(c => c.name));
      }

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
      
      if (transactionsData) {
        const typedTransactions: Transaction[] = (transactionsData as DbTransaction[]).map(t => ({
          ...t,
          type: t.type as "income" | "expense",
          amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount,
        }));
        setTransactions(typedTransactions);
      }

      // Fetch savings
      const { data: savingsData } = await supabase
        .from("savings")
        .select("current_amount")
        .single();
      
      if (savingsData) {
        setCurrentSavings(typeof savingsData.current_amount === 'string' 
          ? parseFloat(savingsData.current_amount) 
          : savingsData.current_amount);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    }
  };

  const handleAddTransaction = async (transaction: Omit<Transaction, "id" | "user_id">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert([{
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      if (data) {
        const typedTransaction: Transaction = {
          ...data,
          type: data.type as "income" | "expense",
          amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
        };
        setTransactions([typedTransaction, ...transactions]);
      }

      // Update savings
      const newSavings = transaction.type === "income" 
        ? currentSavings + transaction.amount
        : currentSavings - transaction.amount;

      await supabase
        .from("savings")
        .update({ current_amount: newSavings })
        .eq("id", (await supabase.from("savings").select("id").single()).data?.id);

      setCurrentSavings(newSavings);
      toast.success(`${transaction.type === "income" ? "Income" : "Expense"} added successfully`);
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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
              <div>
                <h1 className="text-2xl font-bold">FinanceFlow</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.user_metadata?.full_name || user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AddTransactionDialog onAdd={handleAddTransaction} categories={categories} />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
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
