import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PendingTransactionsContentSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { toast } from "sonner";
import { format } from "date-fns";

interface PendingTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: "USD" | "ARS";
  category: string;
  description: string;
  date: string;
  user_id: string;
  source: string | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

const PendingTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PendingTransaction>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [transactionsRes, categoriesRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .eq("status", "pending")
          .order("date", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);

      if (transactionsRes.data) {
        setTransactions(
          transactionsRes.data.map((t) => ({
            ...t,
            type: t.type as "income" | "expense",
            currency: t.currency as "USD" | "ARS",
            amount: typeof t.amount === "string" ? parseFloat(t.amount) : t.amount,
          }))
        );
      }

      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar las transacciones pendientes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (transaction: PendingTransaction) => {
    setEditingId(transaction.id);
    setEditForm({
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      type: transaction.type,
      currency: transaction.currency,
      date: transaction.date,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleConfirm = async (transaction: PendingTransaction) => {
    setSavingId(transaction.id);
    try {
      const updateData = editingId === transaction.id ? {
        ...editForm,
        status: "confirmed",
      } : {
        status: "confirmed",
      };

      const { error } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", transaction.id);

      if (error) throw error;

      setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
      setEditingId(null);
      setEditForm({});
      toast.success("Transacción confirmada");
    } catch (error) {
      console.error("Error confirming transaction:", error);
      toast.error("Error al confirmar la transacción");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setSavingId(id);
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success("Transacción eliminada");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Error al eliminar la transacción");
    } finally {
      setSavingId(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const filteredCategories = categories.filter(
    (c) => c.type === (editForm.type || "expense")
  );

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 pt-safe pb-3 transition-all duration-300">
          <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
            <div className="h-10 flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">Pendientes</h1>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold">
                {transactions.length}
              </Badge>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          {isLoading ? (
            <PendingTransactionsContentSkeleton />
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No hay transacciones pendientes
                </h3>
                <p className="text-muted-foreground">
                  Las transacciones que requieran tu revisión aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const isEditing = editingId === transaction.id;
                const isSaving = savingId === transaction.id;

                return (
                  <Card key={transaction.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              transaction.type === "income"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {transaction.type === "income" ? "Ingreso" : "Gasto"}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(transaction.date), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isEditing ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-1 block">
                                Monto
                              </label>
                              <Input
                                type="number"
                                value={editForm.amount || 0}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    amount: parseFloat(e.target.value) || 0,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">
                                Moneda
                              </label>
                              <Input
                                value={editForm.currency}
                                readOnly
                                className="bg-muted"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">
                                Categoría
                              </label>
                              <Select
                                value={editForm.category}
                                onValueChange={(value) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    category: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Descripción
                            </label>
                            <Textarea
                              value={editForm.description || ""}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              rows={2}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-2xl font-bold ${
                                transaction.type === "income"
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            >
                              {transaction.type === "income" ? "+" : "-"}
                              {formatCurrency(
                                transaction.amount,
                                transaction.currency
                              )}
                            </span>
                            <Badge variant="secondary">
                              {transaction.category}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">
                            {transaction.description}
                          </p>
                        </>
                      )}

                      <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleConfirm(transaction)}
                              disabled={isSaving}
                              className="gap-1"
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Confirmar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(transaction.id)}
                              disabled={isSaving}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(transaction)}
                              disabled={isSaving}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleConfirm(transaction)}
                              disabled={isSaving}
                              className="gap-1"
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Confirmar
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
        
        {/* Spacer to clear bottom nav */}
        <div className="h-[calc(72px+env(safe-area-inset-bottom,0)+2rem)] md:hidden" />
      </div>
    </AppLayout>
  );
};

export default PendingTransactions;
