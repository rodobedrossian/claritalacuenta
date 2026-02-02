import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export interface SavingsData {
  currentSavings: {
    usd: number;
    ars: number;
    recordId: string | null;
  };
  exchangeRate: number;
  entries: SavingsEntry[];
  investments: Investment[];
  goals: SavingsGoal[];
  totals: {
    investedUSD: number;
    investedARS: number;
    patrimonioARS: number;
    activeGoals: number;
    completedGoals: number;
  };
  needsRebuild: boolean;
}

interface UseSavingsDataReturn {
  data: SavingsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Mutations
  addEntry: (entry: Omit<SavingsEntry, "id" | "user_id" | "created_at">) => Promise<void>;
  updateEntry: (id: string, entry: Omit<SavingsEntry, "id" | "user_id" | "created_at">) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addInvestment: (investment: Omit<Investment, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  liquidateInvestment: (id: string) => Promise<void>;
  markInvestmentInactive: (id: string) => Promise<void>;
  reactivateInvestment: (id: string) => Promise<void>;
  addGoal: (goal: Omit<SavingsGoal, "id" | "user_id" | "created_at" | "updated_at" | "is_completed">) => Promise<void>;
  toggleGoalComplete: (id: string, completed: boolean) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export function useSavingsData(userId: string | null): UseSavingsDataReturn {
  const queryClient = useQueryClient();
  const [data, setData] = useState<SavingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const invalidateDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
  }, [queryClient]);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      console.log("Fetching savings data from edge function");

      const { data: responseData, error: functionError } = await supabase.functions.invoke(
        "get-savings-data"
      );

      if (functionError) {
        throw functionError;
      }

      // Type-cast the response
      const typedData: SavingsData = {
        currentSavings: responseData.currentSavings,
        exchangeRate: responseData.exchangeRate,
        entries: (responseData.entries || []).map((e: any) => ({
          ...e,
          currency: e.currency as "USD" | "ARS",
          entry_type: e.entry_type as "deposit" | "withdrawal" | "interest",
          savings_type: (e.savings_type || "cash") as "cash" | "bank" | "other"
        })),
        investments: (responseData.investments || []).map((i: any) => ({
          ...i,
          currency: i.currency as "USD" | "ARS",
          investment_type: i.investment_type as Investment["investment_type"],
          rate_type: i.rate_type as Investment["rate_type"]
        })),
        goals: (responseData.goals || []).map((g: any) => ({
          ...g,
          currency: g.currency as "USD" | "ARS"
        })),
        totals: responseData.totals,
        needsRebuild: responseData.needsRebuild
      };

      // If savings need to be rebuilt from entries, do it now
      if (typedData.needsRebuild) {
        await supabase.from("savings").insert([{
          user_id: userId,
          usd_amount: typedData.currentSavings.usd,
          ars_amount: typedData.currentSavings.ars
        }]);
      }

      setData(typedData);
      console.log(`Savings data loaded: ${typedData.entries.length} entries, ${typedData.investments.length} investments`);
    } catch (err: any) {
      console.error("Error fetching savings data:", err);
      setError(err.message || "Failed to load savings data");
      toast.error("Error al cargar datos de ahorros");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addEntry = useCallback(async (entry: Omit<SavingsEntry, "id" | "user_id" | "created_at">) => {
    if (!userId || !data) return;

    try {
      const { data: newEntry, error } = await supabase
        .from("savings_entries")
        .insert([{ ...entry, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      // Update savings table
      const field = entry.currency === "USD" ? "usd_amount" : "ars_amount";
      const currentAmount = data.currentSavings[entry.currency === "USD" ? "usd" : "ars"];
      const adjustment = entry.entry_type === "withdrawal" ? -entry.amount : entry.amount;
      const newAmount = Math.max(0, currentAmount + adjustment);

      if (data.currentSavings.recordId) {
        await supabase
          .from("savings")
          .update({ [field]: newAmount })
          .eq("id", data.currentSavings.recordId);
      } else {
        await supabase.from("savings").insert([{
          user_id: userId,
          usd_amount: entry.currency === "USD" ? newAmount : 0,
          ars_amount: entry.currency === "ARS" ? newAmount : 0
        }]);
      }

      // Optimistic update
      const typedEntry: SavingsEntry = {
        ...newEntry,
        amount: Number(newEntry.amount),
        currency: newEntry.currency as "USD" | "ARS",
        entry_type: newEntry.entry_type as "deposit" | "withdrawal" | "interest",
        savings_type: (newEntry.savings_type || "cash") as "cash" | "bank" | "other"
      };

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          entries: [typedEntry, ...prev.entries],
          currentSavings: {
            ...prev.currentSavings,
            [entry.currency === "USD" ? "usd" : "ars"]: newAmount
          }
        };
      });

      invalidateDashboard();
      toast.success("Movimiento registrado");
    } catch (err: any) {
      console.error("Error adding entry:", err);
      toast.error("Error al registrar movimiento");
      throw err;
    }
  }, [userId, data, invalidateDashboard]);

  const updateEntry = useCallback(async (id: string, updatedData: Omit<SavingsEntry, "id" | "user_id" | "created_at">) => {
    if (!data) return;

    try {
      const originalEntry = data.entries.find(e => e.id === id);
      if (!originalEntry) return;

      const { error } = await supabase
        .from("savings_entries")
        .update({
          amount: updatedData.amount,
          currency: updatedData.currency,
          entry_type: updatedData.entry_type,
          savings_type: updatedData.savings_type,
          notes: updatedData.notes
        })
        .eq("id", id);

      if (error) throw error;

      // Update savings totals
      if (data.currentSavings.recordId) {
        const originalField = originalEntry.currency === "USD" ? "usd" : "ars";
        const originalAdjustment = originalEntry.entry_type === "withdrawal" ? originalEntry.amount : -originalEntry.amount;

        const newField = updatedData.currency === "USD" ? "usd" : "ars";
        const newAdjustment = updatedData.entry_type === "withdrawal" ? -updatedData.amount : updatedData.amount;

        const updates: Record<string, number> = {};
        const currentSavings = { ...data.currentSavings };

        if (originalField === newField) {
          updates[`${originalField}_amount`] = currentSavings[originalField] + originalAdjustment + newAdjustment;
          currentSavings[originalField] = updates[`${originalField}_amount`];
        } else {
          updates[`${originalField}_amount`] = currentSavings[originalField] + originalAdjustment;
          updates[`${newField}_amount`] = currentSavings[newField] + newAdjustment;
          currentSavings[originalField] = updates[`${originalField}_amount`];
          currentSavings[newField] = updates[`${newField}_amount`];
        }

        await supabase.from("savings").update(updates).eq("id", data.currentSavings.recordId);

        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            entries: prev.entries.map(e => e.id === id ? { ...e, ...updatedData } : e),
            currentSavings
          };
        });
      }

      invalidateDashboard();
      toast.success("Movimiento actualizado");
    } catch (err: any) {
      console.error("Error updating entry:", err);
      toast.error("Error al actualizar movimiento");
      throw err;
    }
  }, [data, invalidateDashboard]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!data) return;

    try {
      const entry = data.entries.find(e => e.id === id);
      if (!entry) return;

      const { error } = await supabase
        .from("savings_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update savings totals
      if (data.currentSavings.recordId) {
        const field = entry.currency === "USD" ? "usd" : "ars";
        const adjustment = entry.entry_type === "withdrawal" ? entry.amount : -entry.amount;
        const newAmount = data.currentSavings[field] + adjustment;

        await supabase
          .from("savings")
          .update({ [`${field}_amount`]: newAmount })
          .eq("id", data.currentSavings.recordId);

        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            entries: prev.entries.filter(e => e.id !== id),
            currentSavings: {
              ...prev.currentSavings,
              [field]: newAmount
            }
          };
        });
      }

      invalidateDashboard();
      toast.success("Movimiento eliminado");
    } catch (err: any) {
      console.error("Error deleting entry:", err);
      toast.error("Error al eliminar movimiento");
      throw err;
    }
  }, [data, invalidateDashboard]);

  const addInvestment = useCallback(async (investment: Omit<Investment, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!userId) return;

    try {
      const { data: newInvestment, error } = await supabase
        .from("investments")
        .insert([{ ...investment, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      const typedInvestment: Investment = {
        ...newInvestment,
        principal_amount: Number(newInvestment.principal_amount),
        current_amount: Number(newInvestment.current_amount),
        interest_rate: newInvestment.interest_rate ? Number(newInvestment.interest_rate) : null,
        currency: newInvestment.currency as "USD" | "ARS",
        investment_type: newInvestment.investment_type as Investment["investment_type"],
        rate_type: newInvestment.rate_type as Investment["rate_type"]
      };

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          investments: [typedInvestment, ...prev.investments]
        };
      });

      toast.success("Inversión registrada");
    } catch (err: any) {
      console.error("Error adding investment:", err);
      toast.error("Error al registrar inversión");
      throw err;
    }
  }, [userId]);

  const deleteInvestment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("investments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          investments: prev.investments.filter(i => i.id !== id)
        };
      });

      toast.success("Inversión eliminada");
    } catch (err: any) {
      console.error("Error deleting investment:", err);
      toast.error("Error al eliminar inversión");
      throw err;
    }
  }, []);

  const liquidateInvestment = useCallback(async (id: string) => {
    if (!userId || !data) return;

    const investment = data.investments.find(i => i.id === id);
    if (!investment) return;

    try {
      // 1. Add savings_entry (deposit - money returns to liquids)
      const { error: entryError } = await supabase.from("savings_entries").insert([
        {
          user_id: userId,
          amount: investment.current_amount,
          currency: investment.currency,
          entry_type: "deposit",
          savings_type: "bank",
          notes: `Liquidación: ${investment.name}`,
        },
      ]);

      if (entryError) throw entryError;

      // 2. Update savings table
      const field = investment.currency === "USD" ? "usd_amount" : "ars_amount";
      const currentAmount = data.currentSavings[investment.currency === "USD" ? "usd" : "ars"];
      const newAmount = currentAmount + investment.current_amount;

      if (data.currentSavings.recordId) {
        const { error: updateError } = await supabase
          .from("savings")
          .update({ [field]: newAmount })
          .eq("id", data.currentSavings.recordId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("savings").insert([
          {
            user_id: userId,
            usd_amount: investment.currency === "USD" ? newAmount : 0,
            ars_amount: investment.currency === "ARS" ? newAmount : 0,
          },
        ]);
        if (insertError) throw insertError;
      }

      // 3. Mark investment as inactive
      const { error: invError } = await supabase
        .from("investments")
        .update({ is_active: false })
        .eq("id", id);

      if (invError) throw invError;

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          investments: prev.investments.map(i =>
            i.id === id ? { ...i, is_active: false } : i
          ),
          currentSavings: {
            ...prev.currentSavings,
            [investment.currency === "USD" ? "usd" : "ars"]: newAmount,
          },
          entries: [
            {
              id: crypto.randomUUID(),
              user_id: userId,
              amount: investment.current_amount,
              currency: investment.currency,
              entry_type: "deposit",
              savings_type: "bank",
              notes: `Liquidación: ${investment.name}`,
              created_at: new Date().toISOString(),
            },
            ...prev.entries,
          ],
        };
      });

      invalidateDashboard();
      toast.success("Sumado a ahorros líquidos");
    } catch (err: any) {
      console.error("Error liquidating investment:", err);
      toast.error("Error al sumar a líquidos");
      throw err;
    }
  }, [userId, data, invalidateDashboard]);

  const markInvestmentInactive = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("investments")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          investments: prev.investments.map(i =>
            i.id === id ? { ...i, is_active: false } : i
          ),
        };
      });
    } catch (err: any) {
      console.error("Error marking investment inactive:", err);
      toast.error("Error al actualizar inversión");
      throw err;
    }
  }, []);

  const reactivateInvestment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("investments")
        .update({ is_active: true })
        .eq("id", id);

      if (error) throw error;

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          investments: prev.investments.map(i =>
            i.id === id ? { ...i, is_active: true } : i
          ),
        };
      });

      toast.success("Inversión reactivada");
    } catch (err: any) {
      console.error("Error reactivating investment:", err);
      toast.error("Error al reactivar inversión");
      throw err;
    }
  }, []);

  const addGoal = useCallback(async (goal: Omit<SavingsGoal, "id" | "user_id" | "created_at" | "updated_at" | "is_completed">) => {
    if (!userId) return;

    try {
      const { data: newGoal, error } = await supabase
        .from("savings_goals")
        .insert([{ ...goal, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      const typedGoal: SavingsGoal = {
        ...newGoal,
        target_amount: Number(newGoal.target_amount),
        currency: newGoal.currency as "USD" | "ARS"
      };

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          goals: [typedGoal, ...prev.goals]
        };
      });

      toast.success("Objetivo creado");
    } catch (err: any) {
      console.error("Error adding goal:", err);
      toast.error("Error al crear objetivo");
      throw err;
    }
  }, [userId]);

  const toggleGoalComplete = useCallback(async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("savings_goals")
        .update({ is_completed: completed })
        .eq("id", id);

      if (error) throw error;

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          goals: prev.goals.map(g => g.id === id ? { ...g, is_completed: completed } : g)
        };
      });

      toast.success(completed ? "¡Objetivo completado!" : "Objetivo reabierto");
    } catch (err: any) {
      console.error("Error updating goal:", err);
      toast.error("Error al actualizar objetivo");
      throw err;
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          goals: prev.goals.filter(g => g.id !== id)
        };
      });

      toast.success("Objetivo eliminado");
    } catch (err: any) {
      console.error("Error deleting goal:", err);
      toast.error("Error al eliminar objetivo");
      throw err;
    }
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    addEntry,
    updateEntry,
    deleteEntry,
    addInvestment,
    deleteInvestment,
    liquidateInvestment,
    markInvestmentInactive,
    reactivateInvestment,
    addGoal,
    toggleGoalComplete,
    deleteGoal
  };
}
