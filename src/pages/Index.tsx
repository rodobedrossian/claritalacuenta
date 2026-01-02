import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { SavingsActionDropdown } from "@/components/SavingsActionDropdown";
import { TransactionsList } from "@/components/TransactionsList";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { SpendingChart } from "@/components/SpendingChart";
import { TimelineChart } from "@/components/TimelineChart";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { useDashboardData, Transaction } from "@/hooks/useDashboardData";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshingRate, setIsRefreshingRate] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeMonth, setActiveMonth] = useState<Date>(new Date());

  // Use the new consolidated data hook
  const { 
    data: dashboardData, 
    loading: dataLoading, 
    refetch,
    updateTransaction,
    deleteTransaction,
    addTransaction,
    updateCurrentSavings,
    updateSavingsTransfers
  } = useDashboardData(activeMonth, user?.id);

  useEffect(() => {
    // Check authentication
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
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
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchExchangeRate = async () => {
    try {
      setIsRefreshingRate(true);
      
      // Call edge function to update
      const { data, error } = await supabase.functions.invoke('fetch-exchange-rate');
      
      if (error) throw error;
      
      if (data?.success && data?.rate) {
        // Refetch dashboard data to get updated rate
        await refetch();
        toast.success('Tipo de cambio actualizado');
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      toast.error('Error al actualizar tipo de cambio');
    } finally {
      setIsRefreshingRate(false);
    }
  };

  const handleAddTransaction = async (transaction: Omit<Transaction, "id">) => {
    if (!user) return;
    await addTransaction(transaction);
  };

  const handleUpdateTransaction = async (id: string, transaction: Omit<Transaction, "id">) => {
    await updateTransaction(id, transaction);
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  const handleAddSavings = async (
    currency: "USD" | "ARS", 
    amount: number, 
    entryType: "deposit" | "withdrawal",
    savingsType: "cash" | "bank" | "other",
    notes?: string
  ) => {
    if (!user) return;
    
    try {
      // Create savings_entries record
      const { error: entryError } = await supabase
        .from("savings_entries")
        .insert([{
          user_id: user.id,
          amount,
          currency,
          entry_type: entryType,
          savings_type: savingsType,
          notes: notes || null
        }]);
      
      if (entryError) throw entryError;

      // Update aggregated savings table
      const amountDelta = entryType === "deposit" ? amount : -amount;
      const currentAmount = dashboardData?.currentSavings[currency === "USD" ? "usd" : "ars"] || 0;
      const newAmount = Math.max(0, currentAmount + amountDelta);
      
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
            usd_amount: currency === "USD" ? (entryType === "deposit" ? amount : 0) : 0,
            ars_amount: currency === "ARS" ? (entryType === "deposit" ? amount : 0) : 0
          }]);
        if (error) throw error;
      }
      
      // Update local state
      updateCurrentSavings({
        ...dashboardData?.currentSavings || { usd: 0, ars: 0 },
        [currency === "USD" ? "usd" : "ars"]: newAmount
      });
      
      // If this is a transfer from balance, update savings transfers
      if (notes?.includes("Transferencia desde balance") && entryType === "deposit") {
        updateSavingsTransfers(currency, amount);
      }
      
      toast.success(entryType === "deposit" ? "Depósito registrado" : "Retiro registrado");
    } catch (error) {
      console.error("Error updating savings:", error);
      toast.error("Error al registrar movimiento");
    }
  };

  const goToPreviousMonth = () => setActiveMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setActiveMonth(prev => addMonths(prev, 1));
  const goToCurrentMonth = () => setActiveMonth(new Date());

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Extract data from dashboard hook
  const currentSavings = dashboardData?.currentSavings || { usd: 0, ars: 0 };
  const exchangeRate = dashboardData?.exchangeRate.rate || 1300;
  const lastUpdated = dashboardData?.exchangeRate.updatedAt;
  const transactions = dashboardData?.transactions || [];
  const categories = dashboardData?.categories || [];
  const users = dashboardData?.users || [];
  const totals = dashboardData?.totals || {
    incomeUSD: 0,
    incomeARS: 0,
    expensesUSD: 0,
    expensesARS: 0,
    savingsTransfersUSD: 0,
    savingsTransfersARS: 0
  };
  const spendingByCategory = dashboardData?.spendingByCategory || [];

  // Calculate available balance (income - expenses - transfers)
  const availableBalanceUSD = Math.max(0, totals.incomeUSD - totals.expensesUSD - totals.savingsTransfersUSD);
  const availableBalanceARS = Math.max(0, totals.incomeARS - totals.expensesARS - totals.savingsTransfersARS);

  // Calculate global values in ARS
  const globalIncomeARS = (totals.incomeUSD * exchangeRate) + totals.incomeARS;
  const globalExpensesARS = (totals.expensesUSD * exchangeRate) + totals.expensesARS;
  const globalSavingsTransfersARS = (totals.savingsTransfersUSD * exchangeRate) + totals.savingsTransfersARS;
  const globalNetBalanceARS = globalIncomeARS - globalExpensesARS - globalSavingsTransfersARS;

  const formatCurrency = (amount: number, currency: "USD" | "ARS") => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)}`;
  };

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
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <SavingsActionDropdown
                  availableBalanceUSD={availableBalanceUSD}
                  availableBalanceARS={availableBalanceARS}
                  onTransferFromBalance={(currency, amount, savingsType, notes) => handleAddSavings(currency, amount, "deposit", savingsType, notes)}
                  onAddSavings={handleAddSavings}
                />
                <AddTransactionDialog onAdd={handleAddTransaction} categories={categories} users={users} currentSavings={currentSavings} />
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
              subtitle={`${formatCurrency(totals.incomeUSD, "USD")} / ${formatCurrency(totals.incomeARS, "ARS")}`}
              icon={TrendingUp}
              trend="up"
            />
            <StatCard 
              title="Gastos Totales" 
              value={formatCurrency(globalExpensesARS, "ARS")}
              subtitle={`${formatCurrency(totals.expensesUSD, "USD")} / ${formatCurrency(totals.expensesARS, "ARS")}`}
              icon={TrendingDown}
            />
            <StatCard 
              title="Balance Neto" 
              value={formatCurrency(globalNetBalanceARS, "ARS")}
              subtitle={`Gastos: ${formatCurrency(globalExpensesARS, "ARS")} | Ahorros: ${formatCurrency(globalSavingsTransfersARS, "ARS")}`}
              icon={Wallet}
              trend={globalNetBalanceARS >= 0 ? "up" : "down"}
            />
          </div>

          {/* Charts and Transactions */}
          <div className="space-y-6 animate-slide-up">
            <TimelineChart transactions={transactions} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendingChart data={spendingByCategory} />
              <TransactionsList 
                transactions={transactions.slice(0, 5)} 
                onEdit={handleEditTransaction}
                showViewAll={transactions.length > 5}
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
