import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { AddSavingsDialog } from "@/components/AddSavingsDialog";
import { TransactionsList } from "@/components/TransactionsList";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { SpendingChart } from "@/components/SpendingChart";
import { TimelineChart } from "@/components/TimelineChart";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, parseISO, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

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
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeMonth, setActiveMonth] = useState<Date>(new Date());
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

  const handleUpdateTransaction = async (id: string, transaction: Omit<Transaction, "id">) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          user_id: transaction.user_id
        })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setTransactions(transactions.map(t => 
        t.id === id 
          ? { ...transaction, id } 
          : t
      ));
      toast.success("Transaction updated successfully");
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success("Transaction deleted successfully");
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };
  const handleAddSavings = async (currency: "USD" | "ARS", amount: number) => {
    try {
      const currentAmount = currentSavings[currency === "USD" ? "usd" : "ars"];
      const newAmount = currentAmount + amount;
      
      // Try to get existing record
      const { data: savingsRecord } = await supabase
        .from("savings")
        .select("id")
        .maybeSingle();
      
      if (savingsRecord) {
        // Update existing record
        const { error } = await supabase
          .from("savings")
          .update(currency === "USD" ? { usd_amount: newAmount } : { ars_amount: newAmount })
          .eq("id", savingsRecord.id);
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from("savings")
          .insert([{
            usd_amount: currency === "USD" ? amount : 0,
            ars_amount: currency === "ARS" ? amount : 0
          }]);
        if (error) throw error;
      }
      
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

  // Filter transactions by active month (hooks must be called before early returns)
  const monthStart = startOfMonth(activeMonth);
  const monthEnd = endOfMonth(activeMonth);
  
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txDate = parseISO(t.date);
      return isWithinInterval(txDate, { start: monthStart, end: monthEnd });
    });
  }, [transactions, activeMonth]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }

  const totalIncomeUSD = monthlyTransactions.filter(t => t.type === "income" && t.currency === "USD").reduce((sum, t) => sum + t.amount, 0);
  const totalIncomeARS = monthlyTransactions.filter(t => t.type === "income" && t.currency === "ARS").reduce((sum, t) => sum + t.amount, 0);
  const totalExpensesUSD = monthlyTransactions.filter(t => t.type === "expense" && t.currency === "USD").reduce((sum, t) => sum + t.amount, 0);
  const totalExpensesARS = monthlyTransactions.filter(t => t.type === "expense" && t.currency === "ARS").reduce((sum, t) => sum + t.amount, 0);

  // Calcular valores globalizados en ARS
  const globalIncomeARS = (totalIncomeUSD * exchangeRate) + totalIncomeARS;
  const globalExpensesARS = (totalExpensesUSD * exchangeRate) + totalExpensesARS;
  const globalNetBalanceARS = globalIncomeARS - globalExpensesARS;
  
  const spendingByCategory = monthlyTransactions.filter(t => t.type === "expense").reduce((acc, t) => {
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

  const goToPreviousMonth = () => setActiveMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setActiveMonth(prev => addMonths(prev, 1));
  const goToCurrentMonth = () => setActiveMonth(new Date());
  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg gradient-primary md:hidden">
                  <Wallet className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Bienvenido, {user?.user_metadata?.full_name || user?.email}
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
                        title="Actualizar tipo de cambio"
                      >
                        <RefreshCw className={`h-3 w-3 ${isRefreshingRate ? 'animate-spin' : ''}`} />
                        {isRefreshingRate ? 'Actualizando...' : 'Actualizar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AddSavingsDialog onAdd={handleAddSavings} />
                <AddTransactionDialog onAdd={handleAddTransaction} categories={categories} users={users} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {/* Month Selector */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <button
              onClick={goToCurrentMonth}
              className="text-xl font-semibold capitalize min-w-[200px] text-center hover:text-primary transition-colors"
            >
              {format(activeMonth, "MMMM yyyy", { locale: es })}
            </button>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
            <StatCard 
              title="Ahorros Actuales" 
              value={`${formatCurrency(currentSavings.usd, "USD")} / ${formatCurrency(currentSavings.ars, "ARS")}`} 
              icon={PiggyBank}
              onClick={() => navigate("/savings")}
            />
            <StatCard 
              title="Ingresos Totales" 
              value={formatCurrency(globalIncomeARS, "ARS")}
              subtitle={`${formatCurrency(totalIncomeUSD, "USD")} / ${formatCurrency(totalIncomeARS, "ARS")}`}
              icon={TrendingUp}
              trend="up"
            />
            <StatCard 
              title="Gastos Totales" 
              value={formatCurrency(globalExpensesARS, "ARS")}
              subtitle={`${formatCurrency(totalExpensesUSD, "USD")} / ${formatCurrency(totalExpensesARS, "ARS")}`}
              icon={TrendingDown}
            />
            <StatCard 
              title="Balance Neto" 
              value={formatCurrency(globalNetBalanceARS, "ARS")}
              icon={Wallet}
              trend={globalNetBalanceARS >= 0 ? "up" : "down"}
            />
          </div>

          {/* Charts and Transactions */}
          <div className="space-y-6 animate-slide-up">
            <TimelineChart transactions={monthlyTransactions} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendingChart data={spendingByCategory} />
              <TransactionsList 
                transactions={monthlyTransactions.slice(0, 5)} 
                onEdit={handleEditTransaction}
                showViewAll={monthlyTransactions.length > 5}
                onViewAll={() => navigate("/transactions")}
              />
            </div>
          </div>
        </main>

        <EditTransactionDialog
          transaction={editingTransaction}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdate={handleUpdateTransaction}
          onDelete={handleDeleteTransaction}
          categories={categories}
          users={users}
        />
      </div>
    </AppLayout>
  );
};
export default Index;