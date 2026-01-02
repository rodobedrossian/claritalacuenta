import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionsList } from "@/components/TransactionsList";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTransactionsData, Transaction, TransactionFilters } from "@/hooks/useTransactionsData";

const Transactions = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Filter states
  const [filters, setFilters] = useState<TransactionFilters>({
    type: "all",
    category: "all",
    userId: "all",
    startDate: "",
    endDate: ""
  });

  // Use the new hook
  const {
    transactions,
    categories,
    users,
    totalCount,
    hasMore,
    loading,
    loadingMore,
    loadMore,
    updateTransaction,
    deleteTransaction
  } = useTransactionsData(filters, user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setAuthLoading(false);
      }
    });
  }, [navigate]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore, loadingMore, hasMore]);

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  const handleUpdateFilter = (key: keyof TransactionFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      type: "all",
      category: "all",
      userId: "all",
      startDate: "",
      endDate: ""
    });
  };

  if (authLoading) {
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
    <AppLayout>
      <div className="min-h-screen">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold">Transacciones</h1>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          {/* Filters Section */}
          <div className="mb-6 p-6 rounded-lg bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Filtros</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <Select value={filters.type} onValueChange={(v) => handleUpdateFilter("type", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Ingreso</SelectItem>
                    <SelectItem value="expense">Gasto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Categoría</label>
                <Select value={filters.category} onValueChange={(v) => handleUpdateFilter("category", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Dueño</label>
                <Select value={filters.userId} onValueChange={(v) => handleUpdateFilter("userId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || "Desconocido"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Desde</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleUpdateFilter("startDate", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Hasta</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleUpdateFilter("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Mostrando {transactions.length} de {totalCount} transacciones
              </p>
              <Button variant="outline" onClick={resetFilters}>
                Limpiar Filtros
              </Button>
            </div>
          </div>

          {/* Loading state for initial load */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Transactions List */}
              <TransactionsList 
                transactions={transactions} 
                onEdit={handleEditTransaction}
              />

              {/* Infinite scroll trigger */}
              <div ref={observerTarget} className="py-8 flex justify-center">
                {loadingMore && (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                )}
                {!hasMore && transactions.length > 0 && (
                  <p className="text-sm text-muted-foreground">No hay más transacciones</p>
                )}
              </div>
            </>
          )}
        </main>

        <EditTransactionDialog
          transaction={editingTransaction}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdate={updateTransaction}
          onDelete={deleteTransaction}
          categories={categories}
          users={users}
        />
      </div>
    </AppLayout>
  );
};

export default Transactions;
