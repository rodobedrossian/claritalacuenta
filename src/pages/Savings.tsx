import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PiggyBank, TrendingUp, Target, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavingsEntriesList } from "@/components/savings/SavingsEntriesList";
import { InvestmentsList } from "@/components/savings/InvestmentsList";
import { GoalsList } from "@/components/savings/GoalsList";
import { AddSavingsEntryDialog } from "@/components/savings/AddSavingsEntryDialog";
import { AddInvestmentDialog } from "@/components/savings/AddInvestmentDialog";
import { AddGoalDialog } from "@/components/savings/AddGoalDialog";
import { EditSavingsEntryDialog } from "@/components/savings/EditSavingsEntryDialog";
import { StatCard } from "@/components/StatCard";
import { AppLayout } from "@/components/AppLayout";
import { useSavingsData, SavingsEntry } from "@/hooks/useSavingsData";

const Savings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<SavingsEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Use the new consolidated data hook
  const {
    data: savingsData,
    loading: dataLoading,
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
        setLoading(false);
      }
    });
  }, [navigate]);

  const handleEditEntry = (entry: SavingsEntry) => {
    setEditingEntry(entry);
    setEditDialogOpen(true);
  };

  const formatCurrency = (amount: number, currency: "USD" | "ARS") => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
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
      <div className="min-h-screen">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary md:hidden">
                <PiggyBank className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Ahorros e Inversiones</h1>
                <p className="text-sm text-muted-foreground">
                  Gestiona tu patrimonio
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
            <StatCard
              title="Ahorros Líquidos"
              value={`${formatCurrency(currentSavings.usd, "USD")}`}
              subtitle={formatCurrency(currentSavings.ars, "ARS")}
              icon={Wallet}
            />
            <StatCard
              title="Total Invertido"
              value={`${formatCurrency(totals.investedUSD, "USD")}`}
              subtitle={formatCurrency(totals.investedARS, "ARS")}
              icon={TrendingUp}
            />
            <StatCard
              title="Patrimonio Total"
              value={formatCurrency(totals.patrimonioARS, "ARS")}
              subtitle={`TC: ${exchangeRate.toFixed(0)}`}
              icon={PiggyBank}
            />
            <StatCard
              title="Objetivos Activos"
              value={totals.activeGoals.toString()}
              subtitle={`${totals.completedGoals} completados`}
              icon={Target}
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="historial" className="animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="historial">Historial</TabsTrigger>
                <TabsTrigger value="inversiones">Inversiones</TabsTrigger>
                <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <AddSavingsEntryDialog onAdd={addEntry} />
                <AddInvestmentDialog onAdd={addInvestment} />
                <AddGoalDialog onAdd={addGoal} />
              </div>
            </div>

            <TabsContent value="historial">
              <SavingsEntriesList entries={entries} onEdit={handleEditEntry} />
            </TabsContent>

            <TabsContent value="inversiones">
              <InvestmentsList 
                investments={investments} 
                onDelete={deleteInvestment}
                exchangeRate={exchangeRate}
              />
            </TabsContent>

            <TabsContent value="objetivos">
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

          <EditSavingsEntryDialog
            entry={editingEntry}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onUpdate={updateEntry}
            onDelete={deleteEntry}
          />
        </main>
      </div>
    </AppLayout>
  );
};

export default Savings;
