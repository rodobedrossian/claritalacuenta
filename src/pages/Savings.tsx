import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavingsEntriesList } from "@/components/savings/SavingsEntriesList";
import { InvestmentsList } from "@/components/savings/InvestmentsList";
import { GoalsList } from "@/components/savings/GoalsList";
import { AddSavingsEntryDialog } from "@/components/savings/AddSavingsEntryDialog";
import { AddInvestmentDialog } from "@/components/savings/AddInvestmentDialog";
import { AddGoalDialog } from "@/components/savings/AddGoalDialog";
import { EditSavingsEntryDialog } from "@/components/savings/EditSavingsEntryDialog";
import { SavingsQuickStats } from "@/components/savings/SavingsQuickStats";
import { SavingsQuickActions } from "@/components/savings/SavingsQuickActions";
import { SavingsActionDropdown } from "@/components/SavingsActionDropdown";
import { AppLayout } from "@/components/AppLayout";
import { SavingsSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { MobileHeader } from "@/components/MobileHeader";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useSavingsData, SavingsEntry } from "@/hooks/useSavingsData";
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
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [investmentDialogOpen, setInvestmentDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [manualSavingsDialogOpen, setManualSavingsDialogOpen] = useState(false);

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
    await refetch();
  }, [refetch]);

  const formatCurrency = (amount: number, currency: "USD" | "ARS") => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  // Handler for manual savings (from SavingsActionDropdown)
  const handleAddManualSavings = async (
    currency: "USD" | "ARS",
    amount: number,
    entryType: "deposit" | "withdrawal",
    savingsType: "cash" | "bank" | "other",
    notes?: string
  ) => {
    await addEntry({
      entry_type: entryType,
      currency,
      amount,
      savings_type: savingsType,
      notes: notes || null,
    });
    setManualSavingsDialogOpen(false);
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
      <div className="min-h-screen pb-20">
        {/* Mobile Header */}
        {isMobile && <MobileHeader userName={userName} />}

        {/* Desktop Header */}
        {!isMobile && (
          <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-6 py-4 pl-14 md:pl-6">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">Ahorros e Inversiones</h1>
                  <p className="text-sm text-muted-foreground">
                    Gestiona tu patrimonio
                  </p>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <PullToRefresh onRefresh={handlePullToRefresh} disabled={dataLoading}>
          <main className="container mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">
            {/* Page title on mobile */}
            {isMobile && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="pt-2"
              >
                <h1 className="text-lg font-semibold">Ahorros e Inversiones</h1>
                <p className="text-xs text-muted-foreground">Gestiona tu patrimonio</p>
              </motion.div>
            )}

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
              onAddDeposit={() => setDepositDialogOpen(true)}
              onAddInvestment={() => setInvestmentDialogOpen(true)}
              onAddGoal={() => setGoalDialogOpen(true)}
              onRegisterPrevious={() => setManualSavingsDialogOpen(true)}
            />

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Tabs defaultValue="historial" className="pt-2">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="historial" className="flex-1 sm:flex-none gap-2">
                    Historial
                    {entries.length > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {entries.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="inversiones" className="flex-1 sm:flex-none gap-2">
                    Inversiones
                    {investments.length > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {investments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="objetivos" className="flex-1 sm:flex-none gap-2">
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

        {/* Add Deposit Dialog */}
        <AddSavingsEntryDialog 
          open={depositDialogOpen}
          onOpenChange={setDepositDialogOpen}
          onAdd={addEntry} 
        />

        {/* Add Investment Dialog */}
        <AddInvestmentDialog 
          open={investmentDialogOpen}
          onOpenChange={setInvestmentDialogOpen}
          onAdd={addInvestment} 
        />

        {/* Add Goal Dialog */}
        <AddGoalDialog 
          open={goalDialogOpen}
          onOpenChange={setGoalDialogOpen}
          onAdd={addGoal} 
        />

        {/* Manual Savings Dialog (for registering previous savings) */}
        <SavingsActionDropdown
          availableBalanceUSD={0}
          availableBalanceARS={0}
          onTransferFromBalance={() => {}}
          onAddSavings={handleAddManualSavings}
          open={manualSavingsDialogOpen}
          onOpenChange={setManualSavingsDialogOpen}
          hideDropdownTrigger
        />
      </div>
    </AppLayout>
  );
};

export default Savings;
