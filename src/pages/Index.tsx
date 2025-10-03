import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { AddSavingsDialog } from "@/components/AddSavingsDialog";
import { TransactionsList } from "@/components/TransactionsList";
import { SpendingChart } from "@/components/SpendingChart";
import { TimelineChart } from "@/components/TimelineChart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
interface Category {
  id: string;
  name: string;
  type: string;
}
interface DbTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
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
  const [currentSavings, setCurrentSavings] = useState({
    usd: 0,
    ars: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [users, setUsers] = useState<Array<{
    id: string;
    full_name: string | null;
  }>>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1300);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshingRate, setIsRefreshingRate] = useState(false);
  useEffect(() => {
    // Check authentication
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
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
      fetchExchangeRate();
    }
  }, [user]);
  const fetchData = async () => {
    try {
      // Fetch users/profiles
      const {
        data: usersData
      } = await supabase.from("profiles").select("id, full_name").order("full_name");
      if (usersData) {
        setUsers(usersData);
      }

      // Fetch categories
      const {
        data: categoriesData
      } = await supabase.from("categories").select("name").order("name");
      if (categoriesData) {
        setCategories(categoriesData.map(c => c.name));
      }

      // Fetch transactions
      const {
        data: transactionsData
      } = await supabase.from("transactions").select("*").order("date", {
        ascending: false
      });
      if (transactionsData) {
        const typedTransactions: Transaction[] = (transactionsData as DbTransaction[]).map(t => ({
          ...t,
          type: t.type as "income" | "expense",
          currency: t.currency as "USD" | "ARS",
          amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount
        }));
        setTransactions(typedTransactions);
      }

      // Fetch savings
      const {
        data: savingsData
      } = await supabase.from("savings").select("usd_amount, ars_amount").single();
      if (savingsData) {
        setCurrentSavings({
          usd: typeof savingsData.usd_amount === 'string' ? parseFloat(savingsData.usd_amount) : savingsData.usd_amount,
          ars: typeof savingsData.ars_amount === 'string' ? parseFloat(savingsData.ars_amount) : savingsData.ars_amount
        });
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    }
  };
  const handleAddTransaction = async (transaction: Omit<Transaction, "id">) => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from("transactions").insert([{
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        user_id: transaction.user_id
      }]).select().single();
      if (error) throw error;

      // Update local state
      if (data) {
        const typedTransaction: Transaction = {
          ...data,
          type: data.type as "income" | "expense",
          currency: data.currency as "USD" | "ARS",
          amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount
        };
        setTransactions([typedTransaction, ...transactions]);
      }
      toast.success(`${transaction.type === "income" ? "Income" : "Expense"} added successfully`);
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
    }
  };
  const handleAddSavings = async (currency: "USD" | "ARS", amount: number) => {
    try {
      const currentAmount = currentSavings[currency === "USD" ? "usd" : "ars"];
      const newAmount = currentAmount + amount;
      const {
        data: savingsRecord
      } = await supabase.from("savings").select("id").single();
      if (!savingsRecord) throw new Error("Savings record not found");
      const {
        error
      } = await supabase.from("savings").update(currency === "USD" ? {
        usd_amount: newAmount
      } : {
        ars_amount: newAmount
      }).eq("id", savingsRecord.id);
      if (error) throw error;
      setCurrentSavings(prev => ({
        ...prev,
        [currency === "USD" ? "usd" : "ars"]: newAmount
      }));
      toast.success("Savings updated successfully");
    } catch (error) {
      console.error("Error updating savings:", error);
      toast.error("Failed to update savings");
    }
  };
  const fetchExchangeRate = async () => {
    try {
      setIsRefreshingRate(true);
      
      // Primero intentar obtener desde la DB
      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('rate, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (rateData) {
        setExchangeRate(rateData.rate);
        setLastUpdated(rateData.updated_at);
      }

      // Llamar al edge function para actualizar
      const { data, error } = await supabase.functions.invoke('fetch-exchange-rate');
      
      if (error) throw error;
      
      if (data?.success && data?.rate) {
        setExchangeRate(data.rate);
        setLastUpdated(data.updated_at);
        toast.success('Exchange rate updated');
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      toast.error('Failed to update exchange rate');
    } finally {
      setIsRefreshingRate(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }
  const totalIncomeUSD = transactions.filter(t => t.type === "income" && t.currency === "USD").reduce((sum, t) => sum + t.amount, 0);
  const totalIncomeARS = transactions.filter(t => t.type === "income" && t.currency === "ARS").reduce((sum, t) => sum + t.amount, 0);
  const totalExpensesUSD = transactions.filter(t => t.type === "expense" && t.currency === "USD").reduce((sum, t) => sum + t.amount, 0);
  const totalExpensesARS = transactions.filter(t => t.type === "expense" && t.currency === "ARS").reduce((sum, t) => sum + t.amount, 0);

  // Calcular valores globalizados en ARS
  const globalIncomeARS = (totalIncomeUSD * exchangeRate) + totalIncomeARS;
  const globalExpensesARS = (totalExpensesUSD * exchangeRate) + totalExpensesARS;
  const globalNetBalanceARS = globalIncomeARS - globalExpensesARS;
  const spendingByCategory = transactions.filter(t => t.type === "expense").reduce((acc, t) => {
    const key = `${t.category} (${t.currency})`;
    const existing = acc.find(item => item.category === key);
    if (existing) {
      existing.amount += t.amount;
    } else {
      acc.push({
        category: key,
        amount: t.amount
      });
    }
    return acc;
  }, [] as Array<{
    category: string;
    amount: number;
  }>).sort((a, b) => b.amount - a.amount);
  const formatCurrency = (amount: number, currency: "USD" | "ARS") => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)}`;
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Y si ahorramos?</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.user_metadata?.full_name || user?.email}
                </p>
                {lastUpdated && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      USD/ARS: {exchangeRate.toFixed(2)}
                    </span>
                    <button
                      onClick={fetchExchangeRate}
                      disabled={isRefreshingRate}
                      className="text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
                      title="Refresh exchange rate"
                    >
                      <RefreshCw className={`h-3 w-3 ${isRefreshingRate ? 'animate-spin' : ''}`} />
                      {isRefreshingRate ? 'Updating...' : 'Refresh'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AddSavingsDialog onAdd={handleAddSavings} />
              <AddTransactionDialog onAdd={handleAddTransaction} categories={categories} users={users} />
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
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
            value={`${formatCurrency(currentSavings.usd, "USD")} / ${formatCurrency(currentSavings.ars, "ARS")}`} 
            icon={PiggyBank} 
          />
          <StatCard 
            title="Total Income" 
            value={formatCurrency(globalIncomeARS, "ARS")}
            subtitle={`${formatCurrency(totalIncomeUSD, "USD")} / ${formatCurrency(totalIncomeARS, "ARS")}`}
            icon={TrendingUp}
            trend="up"
          />
          <StatCard 
            title="Total Expenses" 
            value={formatCurrency(globalExpensesARS, "ARS")}
            subtitle={`${formatCurrency(totalExpensesUSD, "USD")} / ${formatCurrency(totalExpensesARS, "ARS")}`}
            icon={TrendingDown}
          />
          <StatCard 
            title="Net Balance" 
            value={formatCurrency(globalNetBalanceARS, "ARS")}
            icon={Wallet}
            trend={globalNetBalanceARS >= 0 ? "up" : "down"}
          />
        </div>

        {/* Charts and Transactions */}
        <div className="space-y-6 animate-slide-up">
          <TimelineChart transactions={transactions} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendingChart data={spendingByCategory} />
            <TransactionsList transactions={transactions} />
          </div>
        </div>
      </main>
    </div>;
};
export default Index;