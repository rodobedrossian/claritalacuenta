import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon?: string | null;
  color?: string | null;
  created_at: string;
}

interface UseCategoriesDataReturn {
  categories: Category[];
  loading: boolean;
  refetch: () => Promise<void>;
  addCategory: (category: { name: string; type: "income" | "expense" }) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoriesData = (): UseCategoriesDataReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("type")
        .order("name");

      if (error) throw error;

      setCategories(
        (data || []).map((c) => ({
          ...c,
          type: c.type as "income" | "expense",
          icon: c.icon || null,
          color: c.color || null,
        }))
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (category: { name: string; type: "income" | "expense" }) => {
    try {
      // Check if category already exists
      const exists = categories.some(
        (c) => c.name.toLowerCase() === category.name.toLowerCase() && c.type === category.type
      );

      if (exists) {
        toast.error("Ya existe una categoría con ese nombre");
        return;
      }

      const { data, error } = await supabase
        .from("categories")
        .insert([category])
        .select()
        .single();

      if (error) throw error;

      setCategories((prev) => [...prev, { ...data, type: data.type as "income" | "expense" }]);
      toast.success("Categoría creada");
    } catch (error: any) {
      console.error("Error adding category:", error);
      toast.error("Error al crear categoría");
    }
  };

  const updateCategory = async (id: string, category: Partial<Category>) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update(category)
        .eq("id", id);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...category } : c))
      );
      toast.success("Categoría actualizada");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Error al actualizar categoría");
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Check if category is in use
      const { count } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("category", categories.find((c) => c.id === id)?.name || "");

      if (count && count > 0) {
        toast.error("No se puede eliminar: la categoría tiene transacciones asociadas");
        return;
      }

      // Check if category has budgets
      const { count: budgetCount } = await supabase
        .from("budgets")
        .select("id", { count: "exact", head: true })
        .eq("category", categories.find((c) => c.id === id)?.name || "");

      if (budgetCount && budgetCount > 0) {
        toast.error("No se puede eliminar: la categoría tiene presupuestos asociados");
        return;
      }

      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) throw error;

      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Categoría eliminada");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Error al eliminar categoría");
    }
  };

  return {
    categories,
    loading,
    refetch: fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
};
