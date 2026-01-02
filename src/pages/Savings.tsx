import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PiggyBank, TrendingUp, Target, Plus, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SavingsEntriesList } from "@/components/savings/SavingsEntriesList";
import { InvestmentsList } from "@/components/savings/InvestmentsList";
import { GoalsList } from "@/components/savings/GoalsList";
import { AddSavingsEntryDialog } from "@/components/savings/AddSavingsEntryDialog";
import { AddInvestmentDialog } from "@/components/savings/AddInvestmentDialog";
import { AddGoalDialog } from "@/components/savings/AddGoalDialog";
import { StatCard } from "@/components/StatCard";

export interface SavingsEntry {
  id: string;
  user_id: string;
  amount: number;
  currency: "USD" | "ARS";
  entry_type: "deposit" | "withdrawal" | "interest";
  savings_type: "cash" | "bank" | "other";
  notes: string | null;
  created_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  investment_type: "plazo_fijo" | "fci" | "cedear" | "cripto" | "otro";
  currency: "USD" | "ARS";
  principal_amount: number;
  current_amount: number;
  interest_rate: number | null;
  rate_type: "fixed" | "variable" | "none" | null;
  institution: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  currency: "USD" | "ARS";
  target_date: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

const Savings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [currentSavings, setCurrentSavings] = useState({ usd: 0, ars: 0 });
  const [exchangeRate, setExchangeRate] = useState(1300);

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

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      // Fetch savings
      const { data: savingsData } = await supabase
        .from("savings")
        .select("usd_amount, ars_amount")
        .maybeSingle();
      
      if (savingsData) {
        setCurrentSavings({
          usd: Number(savingsData.usd_amount),
          ars: Number(savingsData.ars_amount),
        });
      }

      // Fetch exchange rate
      const { data: rateData } = await supabase
        .from("exchange_rates")
        .select("rate")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (rateData) {
        setExchangeRate(Number(rateData.rate));
      }

      // Fetch entries
      const { data: entriesData } = await supabase
        .from("savings_entries")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (entriesData) {
        setEntries(entriesData.map(e => ({
          ...e,
          amount: Number(e.amount),
          currency: e.currency as "USD" | "ARS",
          entry_type: e.entry_type as "deposit" | "withdrawal" | "interest",
          savings_type: (e.savings_type || "cash") as "cash" | "bank" | "other",
        })));
      }

      // Fetch investments
      const { data: investmentsData } = await supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (investmentsData) {
        setInvestments(investmentsData.map(i => ({
          ...i,
          principal_amount: Number(i.principal_amount),
          current_amount: Number(i.current_amount),
          interest_rate: i.interest_rate ? Number(i.interest_rate) : null,
          currency: i.currency as "USD" | "ARS",
          investment_type: i.investment_type as Investment["investment_type"],
          rate_type: i.rate_type as Investment["rate_type"],
        })));
      }

      // Fetch goals
      const { data: goalsData } = await supabase
        .from("savings_goals")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (goalsData) {
        setGoals(goalsData.map(g => ({
          ...g,
          target_amount: Number(g.target_amount),
          currency: g.currency as "USD" | "ARS",
        })));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar datos");
    }
  };

  const handleAddEntry = async (entry: Omit<SavingsEntry, "id" | "user_id" | "created_at">) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("savings_entries")
        .insert([{ ...entry, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update savings table
      const { data: savingsRecord } = await supabase
        .from("savings")
        .select("id, usd_amount, ars_amount")
        .maybeSingle();
      
      if (savingsRecord) {
        const field = entry.currency === "USD" ? "usd_amount" : "ars_amount";
        const currentAmount = Number(savingsRecord[field]);
        const adjustment = entry.entry_type === "withdrawal" ? -entry.amount : entry.amount;
        
        await supabase
          .from("savings")
          .update({ [field]: currentAmount + adjustment })
          .eq("id", savingsRecord.id);
        
        setCurrentSavings(prev => ({
          ...prev,
          [entry.currency === "USD" ? "usd" : "ars"]: currentAmount + adjustment,
        }));
      }
      
      if (data) {
        setEntries([{
          ...data,
          amount: Number(data.amount),
          currency: data.currency as "USD" | "ARS",
          entry_type: data.entry_type as "deposit" | "withdrawal" | "interest",
          savings_type: (data.savings_type || "cash") as "cash" | "bank" | "other",
        }, ...entries]);
      }
      
      toast.success("Movimiento registrado");
    } catch (error) {
      console.error("Error adding entry:", error);
      toast.error("Error al registrar movimiento");
    }
  };

  const handleAddInvestment = async (investment: Omit<Investment, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("investments")
        .insert([{ ...investment, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setInvestments([{
          ...data,
          principal_amount: Number(data.principal_amount),
          current_amount: Number(data.current_amount),
          interest_rate: data.interest_rate ? Number(data.interest_rate) : null,
          currency: data.currency as "USD" | "ARS",
          investment_type: data.investment_type as Investment["investment_type"],
          rate_type: data.rate_type as Investment["rate_type"],
        }, ...investments]);
      }
      
      toast.success("Inversión registrada");
    } catch (error) {
      console.error("Error adding investment:", error);
      toast.error("Error al registrar inversión");
    }
  };

  const handleAddGoal = async (goal: Omit<SavingsGoal, "id" | "user_id" | "created_at" | "updated_at" | "is_completed">) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("savings_goals")
        .insert([{ ...goal, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setGoals([{
          ...data,
          target_amount: Number(data.target_amount),
          currency: data.currency as "USD" | "ARS",
        }, ...goals]);
      }
      
      toast.success("Objetivo creado");
    } catch (error) {
      console.error("Error adding goal:", error);
      toast.error("Error al crear objetivo");
    }
  };

  const handleToggleGoalComplete = async (goalId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("savings_goals")
        .update({ is_completed: completed })
        .eq("id", goalId);
      
      if (error) throw error;
      
      setGoals(goals.map(g => g.id === goalId ? { ...g, is_completed: completed } : g));
      toast.success(completed ? "¡Objetivo completado!" : "Objetivo reabierto");
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("Error al actualizar objetivo");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", goalId);
      
      if (error) throw error;
      
      setGoals(goals.filter(g => g.id !== goalId));
      toast.success("Objetivo eliminado");
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Error al eliminar objetivo");
    }
  };

  const handleDeleteInvestment = async (investmentId: string) => {
    try {
      const { error } = await supabase
        .from("investments")
        .delete()
        .eq("id", investmentId);
      
      if (error) throw error;
      
      setInvestments(investments.filter(i => i.id !== investmentId));
      toast.success("Inversión eliminada");
    } catch (error) {
      console.error("Error deleting investment:", error);
      toast.error("Error al eliminar inversión");
    }
  };

  const formatCurrency = (amount: number, currency: "USD" | "ARS") => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  // Calculate totals
  const totalInvestedUSD = investments
    .filter(i => i.is_active && i.currency === "USD")
    .reduce((sum, i) => sum + i.current_amount, 0);
  
  const totalInvestedARS = investments
    .filter(i => i.is_active && i.currency === "ARS")
    .reduce((sum, i) => sum + i.current_amount, 0);
  
  const totalPatrimonioARS = 
    (currentSavings.usd * exchangeRate) + currentSavings.ars +
    (totalInvestedUSD * exchangeRate) + totalInvestedARS;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-2 rounded-lg gradient-primary">
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
            value={`${formatCurrency(totalInvestedUSD, "USD")}`}
            subtitle={formatCurrency(totalInvestedARS, "ARS")}
            icon={TrendingUp}
          />
          <StatCard
            title="Patrimonio Total"
            value={formatCurrency(totalPatrimonioARS, "ARS")}
            subtitle={`TC: ${exchangeRate.toFixed(0)}`}
            icon={PiggyBank}
          />
          <StatCard
            title="Objetivos Activos"
            value={goals.filter(g => !g.is_completed).length.toString()}
            subtitle={`${goals.filter(g => g.is_completed).length} completados`}
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
              <AddSavingsEntryDialog onAdd={handleAddEntry} />
              <AddInvestmentDialog onAdd={handleAddInvestment} />
              <AddGoalDialog onAdd={handleAddGoal} />
            </div>
          </div>

          <TabsContent value="historial">
            <SavingsEntriesList entries={entries} />
          </TabsContent>

          <TabsContent value="inversiones">
            <InvestmentsList 
              investments={investments} 
              onDelete={handleDeleteInvestment}
              exchangeRate={exchangeRate}
            />
          </TabsContent>

          <TabsContent value="objetivos">
            <GoalsList
              goals={goals}
              currentSavings={currentSavings}
              totalInvested={{ usd: totalInvestedUSD, ars: totalInvestedARS }}
              exchangeRate={exchangeRate}
              onToggleComplete={handleToggleGoalComplete}
              onDelete={handleDeleteGoal}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Savings;