import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  bank: string | null;
  closing_day: number | null;
  created_at: string;
  updated_at: string;
}

interface UseCreditCardsDataReturn {
  creditCards: CreditCard[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addCreditCard: (card: Omit<CreditCard, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
  updateCreditCard: (id: string, card: Partial<Omit<CreditCard, "id" | "user_id" | "created_at" | "updated_at">>) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
}

export function useCreditCardsData(userId: string | null): UseCreditCardsDataReturn {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditCards = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("credit_cards")
        .select("*")
        .order("name");

      if (fetchError) throw fetchError;

      setCreditCards(data || []);
    } catch (err: any) {
      console.error("Error fetching credit cards:", err);
      setError(err.message || "Failed to load credit cards");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCreditCards();
  }, [fetchCreditCards]);

  const addCreditCard = useCallback(async (card: Omit<CreditCard, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!userId) {
      toast.error("Debes iniciar sesión");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("credit_cards")
        .insert([{ ...card, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      setCreditCards(prev => [...prev, data]);
      toast.success("Tarjeta agregada");
    } catch (err: any) {
      console.error("Error adding credit card:", err);
      toast.error("Error al agregar tarjeta");
      throw err;
    }
  }, [userId]);

  const updateCreditCard = useCallback(async (id: string, card: Partial<Omit<CreditCard, "id" | "user_id" | "created_at" | "updated_at">>) => {
    try {
      const { error } = await supabase
        .from("credit_cards")
        .update(card)
        .eq("id", id);

      if (error) throw error;

      setCreditCards(prev => prev.map(c => c.id === id ? { ...c, ...card } : c));
      toast.success("Tarjeta actualizada");
    } catch (err: any) {
      console.error("Error updating credit card:", err);
      toast.error("Error al actualizar tarjeta");
      throw err;
    }
  }, []);

  const deleteCreditCard = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("credit_cards")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCreditCards(prev => prev.filter(c => c.id !== id));
      toast.success("Tarjeta eliminada");
    } catch (err: any) {
      console.error("Error deleting credit card:", err);
      toast.error("Error al eliminar tarjeta");
      throw err;
    }
  }, []);

  return {
    creditCards,
    loading,
    error,
    refetch: fetchCreditCards,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard
  };
}
