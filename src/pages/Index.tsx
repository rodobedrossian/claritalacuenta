import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TrendingUp, TrendingDown, PiggyBank, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { QuickActions } from "@/components/QuickActions";
import { StatCard } from "@/components/StatCard";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { TransactionsList } from "@/components/TransactionsList";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { SpendingChart } from "@/components/SpendingChart";
import { AppLayout } from "@/components/AppLayout";
import { PullToRefresh } from "@/components/PullToRefresh";
import { BudgetProgress } from "@/components/budgets/BudgetProgress";
import { ImportStatementDialog } from "@/components/credit-cards/ImportStatementDialog";
import { NotificationSetupBanner } from "@/components/notifications/NotificationSetupBanner";
import { VoiceRecordingOverlay } from "@/components/voice/VoiceRecordingOverlay";
import { VoiceConfirmationStep } from "@/components/voice/VoiceConfirmationStep";
import { TransactionInitialData } from "@/components/AddTransactionDialog";
import { SuccessConfetti } from "@/components/animations/SuccessConfetti";
import { InsightsCard } from "@/components/insights/InsightsCard";
import { MobileHeader } from "@/components/MobileHeader";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useVoiceTransaction } from "@/hooks/useVoiceTransaction";
import { useVoiceTokenPrefetch } from "@/hooks/useVoiceTokenPrefetch";
import { useInsightsData } from "@/hooks/useInsightsData";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { useDashboardData, Transaction } from "@/hooks/useDashboardData";
import { useBudgetsData } from "@/hooks/useBudgetsData";
import { AddSavingsWizard } from "@/components/savings-wizard/AddSavingsWizard";
import { useSavingsData } from "@/hooks/useSavingsData";
import { useMonthlyBalance } from "@/hooks/useMonthlyBalance";
import { usePreviousMonthSurplus } from "@/hooks/usePreviousMonthSurplus";
import { PreviousMonthSurplusBanner } from "@/components/PreviousMonthSurplusBanner";
import { TransferSurplusModal } from "@/components/TransferSurplusModal";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);
  const [isRefreshingRate, setIsRefreshingRate] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeMonth, setActiveMonth] = useState<Date>(new Date());
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [voiceConfirmationOpen, setVoiceConfirmationOpen] = useState(false);
  const [addTransactionDialogOpen, setAddTransactionDialogOpen] = useState(false);
  const [voiceInitialData, setVoiceInitialData] = useState<TransactionInitialData | null>(null);
  const [savingsWizardOpen, setSavingsWizardOpen] = useState(false);
  const [transferSurplusModalOpen, setTransferSurplusModalOpen] = useState(false);
  const [isTransferringSurplus, setIsTransferringSurplus] = useState(false);
  const [showVoiceSuccess, setShowVoiceSuccess] = useState(false);
  const [isVoiceTransaction, setIsVoiceTransaction] = useState(false);

  // Auth setup
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Dashboard data
  const { 
    data: dashboardData, 
    loading: dataLoading, 
    isFetching: isDashboardFetching,
    refetch,
    updateTransaction,
    deleteTransaction,
    addTransaction,
    updateSavingsTransfers
  } = useDashboardData(activeMonth, user?.id);

  // Insights data
  const { 
    data: insightsData, 
    loading: insightsLoading, 
    isFetching: isInsightsFetching, 
    refetch: refetchInsights 
  } = useInsightsData(user?.id);

  const isFetchingAny = !!(isDashboardFetching || isInsightsFetching);

  // Budget data
  const transactionsForBudgets = useMemo(() => 
    dashboardData?.transactions.map(t => ({
      category: t.category,
      currency: t.currency,
      amount: t.amount,
      type: t.type
    })) || [], 
  [dashboardData?.transactions]);

  const {
    budgetsWithSpending,
  } = useBudgetsData(user?.id, activeMonth, transactionsForBudgets);

  // Savings wizard (for "Ahorrar" quick action)
  const { addEntry: addSavingsEntry, refetch: refetchSavings } = useSavingsData(user?.id);
  const { balance: monthlyBalance } = useMonthlyBalance(user?.id);

  // Previous month surplus (show banner when current month and pending surplus)
  const {
    record: previousMonthSurplus,
    monthLabel: previousMonthLabel,
    shouldShowBanner: shouldShowSurplusBanner,
    acknowledgeAsSaved,
    acknowledgeAsIgnored,
    refetch: refetchSurplus,
  } = usePreviousMonthSurplus(user?.id);

  const isViewingCurrentMonth =
    format(activeMonth, "yyyy-MM") === format(new Date(), "yyyy-MM");

  const handleTransferSurplusConfirm = async (
    allocation: { allARS: true } | { allARS: false; arsAmount: number; usdAmount: number }
  ) => {
    if (!previousMonthSurplus || !user) return;
    setIsTransferringSurplus(true);
    try {
      const note = `Excedente de ${previousMonthLabel}`;
      if (allocation.allARS) {
        await addSavingsEntry({
          amount: surplusTotalARS,
          currency: "ARS",
          entry_type: "deposit",
          savings_type: "bank",
          notes: note,
        });
      } else {
        if (allocation.arsAmount > 0) {
          await addSavingsEntry({
            amount: allocation.arsAmount,
            currency: "ARS",
            entry_type: "deposit",
            savings_type: "bank",
            notes: note,
          });
        }
        if (allocation.usdAmount > 0) {
          await addSavingsEntry({
            amount: allocation.usdAmount,
            currency: "USD",
            entry_type: "deposit",
            savings_type: "bank",
            notes: note,
          });
        }
      }
      await acknowledgeAsSaved();
      await Promise.all([refetch(), refetchSavings(), refetchSurplus()]);
      toast.success("Excedente agregado a ahorros");
      setTransferSurplusModalOpen(false);
    } catch (err) {
      console.error("Error transferring surplus:", err);
      toast.error("Error al transferir el excedente");
    } finally {
      setIsTransferringSurplus(false);
    }
  };

  const handleSurplusDismiss = async () => {
    try {
      await acknowledgeAsIgnored();
    } catch (err) {
      toast.error("Error al cerrar");
    }
  };

  // Push notifications hook
  const pushNotifications = usePushNotifications(user?.id);

  // Voice setup
  const { getToken, prefetch: prefetchToken } = useVoiceTokenPrefetch();
  const voiceTransaction = useVoiceTransaction({
    categories: dashboardData?.categories || [],
    userName: user?.user_metadata?.full_name || user?.email || "Usuario",
    userId: user?.id,
    getToken
  });

  useEffect(() => {
    if (voiceTransaction.isReady && voiceTransaction.parsedTransaction) {
      setVoiceConfirmationOpen(true);
      prefetchToken();
    }
  }, [voiceTransaction.isReady, voiceTransaction.parsedTransaction, prefetchToken]);

  // Handle URL actions
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get("action");
    if (action === "add-transaction") {
      setAddTransactionDialogOpen(true);
      navigate("/", { replace: true });
    } else if (action === "voice-record") {
      voiceTransaction.startRecording();
      navigate("/", { replace: true });
    }
  }, [location.search, navigate, voiceTransaction]);

  const handlePullToRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchInsights()]);
    toast.success("Datos actualizados");
  }, [refetch, refetchInsights]);

  const fetchExchangeRate = async () => {
    try {
      setIsRefreshingRate(true);
      const { data, error } = await supabase.functions.invoke('fetch-exchange-rate');
      if (error) throw error;
      if (data?.success) {
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

  const goToPreviousMonth = () => setActiveMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setActiveMonth(prev => addMonths(prev, 1));
  const goToCurrentMonth = () => setActiveMonth(new Date());

  if (dataLoading && !dashboardData) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  // Data extraction
  const liquidSavings = dashboardData?.currentSavings || { usd: 0, ars: 0 };
  const totalInvested = dashboardData?.totalInvested || { usd: 0, ars: 0 };
  const currentSavings = {
    usd: (Number(liquidSavings.usd) || 0) + (Number(totalInvested.usd) || 0),
    ars: (Number(liquidSavings.ars) || 0) + (Number(totalInvested.ars) || 0)
  };
  const exchangeRate = dashboardData?.exchangeRate.rate || 1300;
  const surplusTotalARS =
    (previousMonthSurplus?.surplus_usd ?? 0) * exchangeRate + (previousMonthSurplus?.surplus_ars ?? 0);
  const lastUpdated = dashboardData?.exchangeRate.updatedAt;
  const transactions = dashboardData?.transactions || [];
  const categories = dashboardData?.categories || [];
  const creditCards = dashboardData?.creditCards || [];
  const totals = dashboardData?.totals || {
    incomeUSD: 0, incomeARS: 0, expensesUSD: 0, expensesARS: 0,
    projectedExpensesUSD: 0, projectedExpensesARS: 0, savingsTransfersUSD: 0, savingsTransfersARS: 0
  };
  const spendingByCategory = dashboardData?.spendingByCategory || [];

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
    <AppLayout onMobileAddClick={() => setAddTransactionDialogOpen(true)}>
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Mobile View */}
        {isMobile ? (
          <>
            <MobileHeader userName={user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario'} />
            <PullToRefresh onRefresh={handlePullToRefresh} className="flex-1 overflow-y-auto" disabled={dataLoading}>
              <div className="relative">
                {isFetchingAny && (
                  <div className="absolute top-2 right-4 flex items-center gap-1.5 z-50 bg-background/60 backdrop-blur-md px-2 py-1 rounded-full border border-border/40">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Sincronizando</span>
                  </div>
                )}
                
                <DashboardHeader
                  userName={user?.user_metadata?.full_name || user?.email}
                  exchangeRate={exchangeRate}
                  lastUpdated={lastUpdated}
                  isRefreshingRate={isRefreshingRate}
                  onRefreshRate={fetchExchangeRate}
                  activeMonth={activeMonth}
                  onPreviousMonth={goToPreviousMonth}
                  onNextMonth={goToNextMonth}
                  onCurrentMonth={goToCurrentMonth}
                  netBalance={globalNetBalanceARS}
                  formatCurrency={formatCurrency}
                />

                <main className="container mx-auto px-4 py-3 space-y-4">
                  <NotificationSetupBanner
                    isSupported={pushNotifications.isSupported}
                    isPWA={pushNotifications.isPWA}
                    platform={pushNotifications.platform}
                    hasSubscription={pushNotifications.subscriptions.length > 0}
                    permission={pushNotifications.permission}
                    onSubscribe={pushNotifications.subscribe}
                    subscribing={pushNotifications.subscribing}
                  />

                  {isViewingCurrentMonth && shouldShowSurplusBanner && previousMonthSurplus && (
                    <PreviousMonthSurplusBanner
                      surplusTotalARS={surplusTotalARS}
                      monthLabel={previousMonthLabel}
                      onAddToSavings={() => setTransferSurplusModalOpen(true)}
                      onDismiss={handleSurplusDismiss}
                    />
                  )}

                  <div className="grid grid-cols-1 gap-3 animate-fade-in">
                    <StatCard 
                      title="Ingresos del mes" 
                      value={formatCurrency(globalIncomeARS, "ARS")}
                      secondaryTop={formatCurrency(totals.incomeUSD, "USD")}
                      secondaryBottom={formatCurrency(totals.incomeARS, "ARS")}
                      icon={TrendingUp}
                      variant="success"
                    />
                    <StatCard 
                      title="Gastos del mes" 
                      value={formatCurrency(globalExpensesARS, "ARS")}
                      secondaryTop={formatCurrency(totals.expensesUSD, "USD")}
                      secondaryBottom={formatCurrency(totals.expensesARS, "ARS")}
                      icon={TrendingDown}
                      variant="destructive"
                    />
                    <StatCard 
                      title="Ahorros" 
                      value={
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg sm:text-xl font-black">{formatCurrency(liquidSavings.usd, "USD")}</span>
                            <span className="text-[9px] font-bold opacity-40 uppercase tracking-wider text-muted-foreground">líquidos</span>
                          </div>
                          {(Number(totalInvested.ars) > 0 || Number(totalInvested.usd) > 0) && (
                            <div className="flex items-baseline gap-1.5 border-t border-border/20 pt-0.5 mt-0.5">
                              <span className="text-lg sm:text-xl font-black text-primary/80">
                                {formatCurrency(totalInvested.ars, "ARS")}
                                {Number(totalInvested.usd) > 0 && ` / ${formatCurrency(totalInvested.usd, "USD")}`}
                              </span>
                              <span className="text-[9px] font-bold opacity-40 uppercase tracking-wider text-muted-foreground">invertidos</span>
                            </div>
                          )}
                        </div>
                      }
                      icon={PiggyBank}
                      onClick={() => navigate("/savings")}
                    />
                  </div>

                  <QuickActions 
                    onAddExpense={() => setAddTransactionDialogOpen(true)}
                    onVoiceRecord={() => voiceTransaction.startRecording()}
                    onTransferToSavings={() => setSavingsWizardOpen(true)}
                    isRecording={voiceTransaction.isRecording}
                    isProcessing={voiceTransaction.isProcessing}
                  />

                  <div className="animate-fade-in">
                    {budgetsWithSpending.length > 0 ? (
                      <BudgetProgress budgets={budgetsWithSpending} onManageBudgets={() => navigate("/budgets")} />
                    ) : (
                      <Card className="p-6 bg-card border border-border shadow-stripe">
                        <div className="flex flex-col gap-4 text-center">
                          <h3 className="text-lg font-semibold">Presupuestos del mes</h3>
                          <Button onClick={() => navigate("/budgets")} className="gradient-primary w-full">Crear presupuesto</Button>
                        </div>
                      </Card>
                    )}
                  </div>

                  <InsightsCard insights={insightsData?.insights || []} loading={insightsLoading} onRefresh={refetchInsights} />

                  <div className="space-y-6 animate-slide-up pb-8">
                    <SpendingChart data={spendingByCategory} />
                    <TransactionsList 
                      transactions={transactions.slice(0, 5)} 
                      onEdit={(t) => { setEditingTransaction(t); setEditDialogOpen(true); }}
                      showViewAll={transactions.length > 5}
                      onViewAll={() => navigate("/transactions")}
                    />
                  </div>
                </main>
              </div>
            </PullToRefresh>
          </>
        ) : (
          /* Desktop View */
          <div className="flex-1 overflow-y-auto">
            <header className="border-b border-border bg-background sticky top-0 z-10">
              <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Bienvenido, {user?.user_metadata?.full_name || user?.email}</p>
                  {lastUpdated && <p className="text-xs text-muted-foreground">USD/ARS: {exchangeRate.toFixed(2)}</p>}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setImportDialogOpen(true)}>Importar</Button>
                  <Button onClick={() => setAddTransactionDialogOpen(true)}>Nueva transacción</Button>
                </div>
              </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-8">
              <div className="flex items-center justify-center gap-4">
                <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-bold capitalize min-w-[200px] text-center">
                  {format(activeMonth, "MMMM yyyy", { locale: es })}
                </h2>
                <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="bg-card rounded-2xl p-8 border text-center max-w-lg mx-auto shadow-sm">
                <p className="text-sm font-medium text-muted-foreground mb-1">Balance neto</p>
                <p className={`text-4xl font-bold ${globalNetBalanceARS >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(globalNetBalanceARS, "ARS")}
                </p>
              </div>

              {isViewingCurrentMonth && shouldShowSurplusBanner && previousMonthSurplus && (
                <div className="max-w-lg mx-auto">
                  <PreviousMonthSurplusBanner
                    surplusTotalARS={surplusTotalARS}
                    monthLabel={previousMonthLabel}
                    onAddToSavings={() => setTransferSurplusModalOpen(true)}
                    onDismiss={handleSurplusDismiss}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Ingresos del mes" 
                  value={formatCurrency(globalIncomeARS, "ARS")} 
                  secondaryTop={formatCurrency(totals.incomeUSD, "USD")}
                  secondaryBottom={formatCurrency(totals.incomeARS, "ARS")}
                  icon={TrendingUp} 
                  variant="success" 
                />
                <StatCard 
                  title="Gastos del mes" 
                  value={formatCurrency(globalExpensesARS, "ARS")} 
                  secondaryTop={formatCurrency(totals.expensesUSD, "USD")}
                  secondaryBottom={formatCurrency(totals.expensesARS, "ARS")}
                  icon={TrendingDown} 
                  variant="destructive" 
                />
                <StatCard 
                  title="Ahorros" 
                  value={
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-black">{formatCurrency(liquidSavings.usd, "USD")}</span>
                        <span className="text-[10px] font-bold opacity-40 uppercase tracking-wider">líquidos</span>
                      </div>
                      {(Number(totalInvested.ars) > 0 || Number(totalInvested.usd) > 0) && (
                        <div className="flex items-baseline gap-1.5 border-t border-border/20 pt-0.5 mt-0.5">
                          <span className="text-lg sm:text-xl font-black text-primary/80">
                            {formatCurrency(totalInvested.ars, "ARS")}
                            {Number(totalInvested.usd) > 0 && ` / ${formatCurrency(totalInvested.usd, "USD")}`}
                          </span>
                          <span className="text-[9px] font-bold opacity-40 uppercase tracking-wider">invertidos</span>
                        </div>
                      )}
                    </div>
                  } 
                  icon={PiggyBank} 
                  onClick={() => navigate("/savings")} 
                />
              </div>

              <div className="animate-fade-in">
                <InsightsCard 
                  insights={insightsData?.insights || []} 
                  loading={insightsLoading} 
                  onRefresh={refetchInsights} 
                />
              </div>

              <div className="animate-fade-in">
                {budgetsWithSpending.length > 0 ? (
                  <BudgetProgress budgets={budgetsWithSpending} onManageBudgets={() => navigate("/budgets")} />
                ) : (
                  <Card className="p-6 bg-card border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Presupuestos del mes</h3>
                        <p className="text-sm text-muted-foreground">Configurá tus límites de gasto</p>
                      </div>
                      <Button onClick={() => navigate("/budgets")} variant="outline">Gestionar</Button>
                    </div>
                  </Card>
                )}
              </div>

              <SpendingChart data={spendingByCategory} />
              <TransactionsList 
                transactions={transactions.slice(0, 10)} 
                onEdit={(t) => { setEditingTransaction(t); setEditDialogOpen(true); }}
              />
            </main>
          </div>
        )}

        {/* Dialogs & Overlays */}
        <EditTransactionDialog
          transaction={editingTransaction}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdate={updateTransaction}
          onDelete={deleteTransaction}
          categories={categories}
        />

        <AddTransactionDialog 
          onAdd={addTransaction} 
          categories={categories} 
          currentUserId={user?.id || ""}
          currentSavings={currentSavings} 
          open={addTransactionDialogOpen}
          onOpenChange={setAddTransactionDialogOpen}
          initialData={voiceInitialData}
        />

        <ImportStatementDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          userId={user?.id || ""}
          creditCards={creditCards}
          onSuccess={refetch}
        />

        <VoiceRecordingOverlay
          isOpen={voiceTransaction.isActive && !voiceTransaction.isReady}
          state={voiceTransaction.state}
          duration={voiceTransaction.duration}
          transcribedText={voiceTransaction.transcribedText}
          partialText={voiceTransaction.partialText}
          getAudioLevels={voiceTransaction.getAudioLevels}
          onStop={voiceTransaction.stopRecording}
          onCancel={voiceTransaction.cancel}
          error={voiceTransaction.error}
        />

        <VoiceConfirmationStep
          open={voiceConfirmationOpen}
          onOpenChange={setVoiceConfirmationOpen}
          transaction={voiceTransaction.parsedTransaction}
          transcribedText={voiceTransaction.transcribedText}
          onConfirmDirect={async () => {
            if (voiceTransaction.parsedTransaction && user) {
              const tx = voiceTransaction.parsedTransaction;
              const newTransaction: Omit<Transaction, "id"> = {
                user_id: user.id,
                type: tx.type,
                amount: tx.amount,
                currency: tx.currency,
                category: tx.category,
                description: tx.description || "",
                date: tx.date || new Date().toISOString().split('T')[0],
                payment_method: "debit",
                from_savings: false,
              };
              setIsVoiceTransaction(true);
              setVoiceConfirmationOpen(false);
              await addTransaction(newTransaction);
              voiceTransaction.reset();
              setShowVoiceSuccess(true);
            }
          }}
          onEdit={() => {
            if (voiceTransaction.parsedTransaction) {
              const tx = voiceTransaction.parsedTransaction;
              setVoiceInitialData({
                type: tx.type, amount: tx.amount, currency: tx.currency,
                category: tx.category, description: tx.description, date: new Date(tx.date),
              });
              setIsVoiceTransaction(true);
              setVoiceConfirmationOpen(false);
              setAddTransactionDialogOpen(true);
              voiceTransaction.reset();
            }
          }}
          onRetry={() => { setVoiceConfirmationOpen(false); voiceTransaction.retry(); }}
          onCancel={() => { setVoiceConfirmationOpen(false); voiceTransaction.reset(); }}
        />

        <SuccessConfetti show={showVoiceSuccess} onComplete={() => setShowVoiceSuccess(false)} message="¡Transacción guardada!" />

        <AddSavingsWizard
          open={savingsWizardOpen}
          onOpenChange={setSavingsWizardOpen}
          onAdd={async (entry) => {
            await addSavingsEntry(entry);
            refetch();
          }}
          availableBalanceUSD={monthlyBalance.availableUSD}
          availableBalanceARS={monthlyBalance.availableARS}
        />

        <TransferSurplusModal
          open={transferSurplusModalOpen}
          onOpenChange={setTransferSurplusModalOpen}
          surplusTotalARS={surplusTotalARS}
          exchangeRate={exchangeRate}
          monthLabel={previousMonthLabel}
          onConfirm={handleTransferSurplusConfirm}
          isSubmitting={isTransferringSurplus}
        />
      </div>
    </AppLayout>
  );
};

export default Index;
