import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavingsEntriesList } from "@/components/savings/SavingsEntriesList";
import { InvestmentsList } from "@/components/savings/InvestmentsList";
import { GoalsList } from "@/components/savings/GoalsList";
import { AddSavingsWizard } from "@/components/savings-wizard/AddSavingsWizard";
import { AddInvestmentWizard } from "@/components/investment-wizard/AddInvestmentWizard";
import { AddGoalWizard } from "@/components/goal-wizard/AddGoalWizard";
import { EditSavingsEntryDialog } from "@/components/savings/EditSavingsEntryDialog";
import { SavingsQuickStats } from "@/components/savings/SavingsQuickStats";
import { SavingsQuickActions } from "@/components/savings/SavingsQuickActions";
import { AppLayout } from "@/components/AppLayout";
import { SavingsSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { MobileHeader } from "@/components/MobileHeader";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useSavingsData, SavingsEntry } from "@/hooks/useSavingsData";
import { useMonthlyBalance } from "@/hooks/useMonthlyBalance";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const Savings = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState("Usuario");
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<SavingsEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Dialog states for quick actions
  const [savingsWizardOpen, setSavingsWizardOpen] = useState(false);
  const [investmentWizardOpen, setInvestmentWizardOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  // Use the consolidated data hook
  const {
    data: savingsData,
    loading: dataLoading,
    refetch,
    addEntry,
    updateEntry,
    deleteEntry,
    addInvestment,
    deleteInvestment,
    addGoal,
    toggleGoalComplete,
    deleteGoal
  } = useSavingsData(user?.id);

  // Get monthly balance for savings wizard
  const { balance: monthlyBalance, refetch: refetchBalance } = useMonthlyBalance(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        // Extract first name for greeting
        const fullName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Usuario";
        const firstName = fullName.split(" ")[0];
        setUserName(firstName);
        setLoading(false);
      }
    });
  }, [navigate]);

  const handleEditEntry = (entry: SavingsEntry) => {
    setEditingEntry(entry);
    setEditDialogOpen(true);
  };

  const handlePullToRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchBalance()]);
  }, [refetch, refetchBalance]);

  const formatCurrency = (amount: number, currency: "USD" | "ARS") => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  if (loading || dataLoading) {
    return (
      <AppLayout>
        <SavingsSkeleton />
      </AppLayout>
    );
  }

  // Extract data from hook
  const currentSavings = savingsData?.currentSavings || { usd: 0, ars: 0 };
  const exchangeRate = savingsData?.exchangeRate || 1300;
  const entries = savingsData?.entries || [];
  const investments = savingsData?.investments || [];
  const goals = savingsData?.goals || [];
  const totals = savingsData?.totals || {
    investedUSD: 0,
    investedARS: 0,
    patrimonioARS: 0,
    activeGoals: 0,
    completedGoals: 0
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden bg-background">
        {/* Header - Fixed sticky with safe area */}
        <header className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-xl z-40 pt-safe pb-3 transition-all duration-300">
          <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
            <div className="h-10 flex flex-col justify-center">
              <h1 className="text-xl font-bold tracking-tight">Ahorros e Inversiones</h1>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Gestiona tu patrimonio
              </p>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable area */}
        <PullToRefresh onRefresh={handlePullToRefresh} className="flex-1 overflow-y-auto" disabled={dataLoading}>
          <main className="container mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">
            {/* Quick Stats */}
            <SavingsQuickStats
              currentSavings={currentSavings}
              totalInvested={{ usd: totals.investedUSD, ars: totals.investedARS }}
              patrimonioARS={totals.patrimonioARS}
              exchangeRate={exchangeRate}
              activeGoals={totals.activeGoals}
              completedGoals={totals.completedGoals}
              formatCurrency={formatCurrency}
            />

            {/* Quick Actions */}
            <SavingsQuickActions
              onAddSavings={() => setSavingsWizardOpen(true)}
              onAddInvestment={() => setInvestmentWizardOpen(true)}
              onAddGoal={() => setGoalDialogOpen(true)}
            />

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Tabs defaultValue="historial" className="pt-2">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="historial" className="flex-1 sm:flex-none gap-2 whitespace-nowrap">
                    Historial
                    {entries.length > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {entries.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="inversiones" className="flex-1 sm:flex-none gap-2 whitespace-nowrap">
                    Inversiones
                    {investments.length > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {investments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="objetivos" className="flex-1 sm:flex-none gap-2 whitespace-nowrap">
                    Objetivos
                    {goals.length > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {goals.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="historial" className="mt-4">
                  <SavingsEntriesList entries={entries} onEdit={handleEditEntry} />
                </TabsContent>

                <TabsContent value="inversiones" className="mt-4">
                  <InvestmentsList 
                    investments={investments} 
                    onDelete={deleteInvestment}
                    exchangeRate={exchangeRate}
                  />
                </TabsContent>

                <TabsContent value="objetivos" className="mt-4">
                  <GoalsList
                    goals={goals}
                    currentSavings={currentSavings}
                    totalInvested={{ usd: totals.investedUSD, ars: totals.investedARS }}
                    exchangeRate={exchangeRate}
                    onToggleComplete={toggleGoalComplete}
                    onDelete={deleteGoal}
                  />
                </TabsContent>
              </Tabs>
            </motion.div>
          </main>
        </PullToRefresh>

        {/* Edit Entry Dialog */}
        <EditSavingsEntryDialog
          entry={editingEntry}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdate={updateEntry}
          onDelete={deleteEntry}
        />

        {/* Add Savings Wizard */}
        <AddSavingsWizard
          open={savingsWizardOpen}
          onOpenChange={setSavingsWizardOpen}
          onAdd={addEntry}
          availableBalanceUSD={monthlyBalance.availableUSD}
          availableBalanceARS={monthlyBalance.availableARS}
        />

        {/* Add Investment Wizard */}
        <AddInvestmentWizard 
          open={investmentWizardOpen}
          onOpenChange={setInvestmentWizardOpen}
          onAdd={addInvestment} 
        />

        {/* Add Goal Wizard */}
        <AddGoalWizard 
          open={goalDialogOpen}
          onOpenChange={setGoalDialogOpen}
          onAdd={addGoal} 
        />
      </div>
    </AppLayout>
  );
};

export default Savings;
