import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, RefreshCw, ChevronLeft, ChevronRight, FileUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { SavingsActionDropdown } from "@/components/SavingsActionDropdown";
import { TransactionsList } from "@/components/TransactionsList";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { SpendingChart } from "@/components/SpendingChart";
import { TimelineChart } from "@/components/TimelineChart";
import { AppLayout } from "@/components/AppLayout";
import { BudgetProgress } from "@/components/budgets/BudgetProgress";
import { ImportStatementDialog } from "@/components/credit-cards/ImportStatementDialog";
import { NotificationSetupBanner } from "@/components/notifications/NotificationSetupBanner";
import { VoiceTransactionButton } from "@/components/voice/VoiceTransactionButton";
import { VoiceTransactionDialog } from "@/components/voice/VoiceTransactionDialog";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useVoiceTransaction } from "@/hooks/useVoiceTransaction";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { useDashboardData, Transaction, CreditCard } from "@/hooks/useDashboardData";
import { useBudgetsData } from "@/hooks/useBudgetsData";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshingRate, setIsRefreshingRate] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeMonth, setActiveMonth] = useState<Date>(new Date());
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);

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

  // Budget data
  const transactionsForBudgets = dashboardData?.transactions.map(t => ({
    category: t.category,
    currency: t.currency,
    amount: t.amount,
    type: t.type
  })) || [];

  const {
    budgets,
    budgetsWithSpending,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useBudgetsData(user?.id, activeMonth, transactionsForBudgets);

  // Push notifications hook
  const pushNotifications = usePushNotifications(user?.id);

  // Voice transaction hook
  const voiceTransaction = useVoiceTransaction({
    categories: dashboardData?.categories || [],
    users: (dashboardData?.users || []).map(u => ({ name: u.full_name })),
    userName: user?.user_metadata?.full_name || user?.email || "Usuario"
  });

  // Open dialog when voice transaction is parsed
  useEffect(() => {
    if (voiceTransaction.parsedTransaction) {
      setVoiceDialogOpen(true);
    }
  }, [voiceTransaction.parsedTransaction]);

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
  const creditCards = dashboardData?.creditCards || [];
  const totals = dashboardData?.totals || {
    incomeUSD: 0,
    incomeARS: 0,
    expensesUSD: 0,
    expensesARS: 0,
    projectedExpensesUSD: 0,
    projectedExpensesARS: 0,
    savingsTransfersUSD: 0,
    savingsTransfersARS: 0
  };
  const spendingByCategory = dashboardData?.spendingByCategory || [];

  // Calculate available balance (income - expenses - transfers) - projected expenses don't impact balance
  const availableBalanceUSD = Math.max(0, totals.incomeUSD - totals.expensesUSD - totals.savingsTransfersUSD);
  const availableBalanceARS = Math.max(0, totals.incomeARS - totals.expensesARS - totals.savingsTransfersARS);

  // Calculate global values in ARS (effective expenses only)
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
        {/* Notification Banner */}
        <div className="container mx-auto px-6 pt-4">
          <NotificationSetupBanner
            isSupported={pushNotifications.isSupported}
            isPWA={pushNotifications.isPWA}
            hasSubscription={pushNotifications.subscriptions.length > 0}
            permission={pushNotifications.permission}
            onSubscribe={pushNotifications.subscribe}
            subscribing={pushNotifications.subscribing}
          />
        </div>

        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 md:px-6 py-4 pl-14 md:pl-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg gradient-primary md:hidden hidden">
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
              <div className="flex items-center gap-2 sm:gap-3">
                {creditCards.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImportDialogOpen(true)}
                    className="hidden sm:flex"
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    Importar Resumen
                  </Button>
                )}
                <VoiceTransactionButton
                  isRecording={voiceTransaction.isRecording}
                  isProcessing={voiceTransaction.isProcessing}
                  onStart={voiceTransaction.startRecording}
                  onStop={voiceTransaction.stopRecording}
                />
                <SavingsActionDropdown
                  availableBalanceUSD={availableBalanceUSD}
                  availableBalanceARS={availableBalanceARS}
                  onTransferFromBalance={(currency, amount, savingsType, notes) => handleAddSavings(currency, amount, "deposit", savingsType, notes)}
                  onAddSavings={handleAddSavings}
                />
                <AddTransactionDialog onAdd={handleAddTransaction} categories={categories} users={users} currentSavings={currentSavings} creditCards={creditCards} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
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


          {/* Budget Progress */}
          <div className="animate-fade-in mb-6">
            {budgetsWithSpending.length > 0 ? (
              <BudgetProgress
                budgets={budgetsWithSpending}
                projectedExpensesUSD={totals.projectedExpensesUSD}
                projectedExpensesARS={totals.projectedExpensesARS}
                onManageBudgets={() => navigate("/budgets")}
              />
            ) : (
              <Card className="p-6 gradient-card border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Presupuestos del Mes</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configura límites de gasto por categoría para controlar tus finanzas
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate("/budgets")}
                    className="gradient-primary"
                  >
                    Crear Presupuesto
                  </Button>
                </div>
              </Card>
            )}
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


        <ImportStatementDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          userId={user?.id || ""}
          creditCards={creditCards}
          categories={categories}
          onSuccess={refetch}
        />

        <VoiceTransactionDialog
          open={voiceDialogOpen}
          onOpenChange={(open) => {
            setVoiceDialogOpen(open);
            if (!open) voiceTransaction.reset();
          }}
          transaction={voiceTransaction.parsedTransaction}
          transcribedText={voiceTransaction.transcribedText}
          categories={categories}
          users={users.map(u => ({ id: u.id, name: u.full_name }))}
          onConfirm={async (transaction) => {
            await handleAddTransaction({
              type: transaction.type,
              amount: transaction.amount,
              currency: transaction.currency,
              category: transaction.category,
              description: transaction.description,
              date: transaction.date,
              user_id: transaction.owner_id || users[0]?.id || user?.id || "",
              payment_method: "cash",
              from_savings: false
            });
            setVoiceDialogOpen(false);
            voiceTransaction.reset();
            toast.success("Transacción creada por voz");
          }}
          onCancel={() => {
            setVoiceDialogOpen(false);
            voiceTransaction.reset();
          }}
        />
      </div>
    </AppLayout>
  );
};

export default Index;
