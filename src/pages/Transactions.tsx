import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionsList } from "@/components/TransactionsList";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { AppLayout } from "@/components/AppLayout";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsListSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useTransactionsData, Transaction, TransactionFilters } from "@/hooks/useTransactionsData";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

const Transactions = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Filter states
  const [filters, setFilters] = useState<TransactionFilters>({
    type: "all",
    category: "all",
    userId: "",
    startDate: "",
    endDate: ""
  });

  // Use the new hook
  const {
    transactions,
    categories,
    totalCount,
    hasMore,
    loading,
    loadingMore,
    loadMore,
    refetch,
    updateTransaction,
    deleteTransaction
  } = useTransactionsData(filters, user?.id);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await refetch();
    toast.success("Transacciones actualizadas");
  }, [refetch]);

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
    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(currentTarget);

    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

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
      userId: "",
      startDate: "",
      endDate: ""
    });
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen">
          <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-6 py-4 pl-14 md:pl-6">
              <Skeleton className="h-7 w-40" />
            </div>
          </header>
          <main className="container mx-auto px-4 md:px-6 py-6">
            <div className="rounded-lg bg-card border border-border/50 p-4">
              <TransactionsListSkeleton count={8} />
            </div>
          </main>
        </div>
      </AppLayout>
    );
  }

  const hasActiveFilters = filters.type !== "all" || filters.category !== "all" || 
    filters.startDate !== "" || filters.endDate !== "";

  return (
    <AppLayout>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen" disabled={loading}>
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 pt-safe pb-3 transition-all duration-300">
          <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
            <div className="h-10 flex items-center">
              <h1 className="text-xl font-bold tracking-tight">Transacciones</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Filters Section */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <div className="mb-6 rounded-lg bg-card border border-border/50 overflow-hidden">
              <CollapsibleTrigger asChild>
                <button 
                  className="w-full flex items-center justify-between p-4 md:p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Filtros</h2>
                    {hasActiveFilters && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Activos
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                      {transactions.length} de {totalCount}
                    </span>
                    {filtersOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="px-4 pb-4 md:px-6 md:pb-6 border-t border-border/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
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

                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={resetFilters} size="sm">
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Loading state for initial load */}
          {loading ? (
            <div className="rounded-lg bg-card border border-border/50 p-4">
              <TransactionsListSkeleton count={10} />
            </div>
          ) : (
            <>
              {/* Transactions List */}
              <div className="rounded-lg bg-card border border-border/50 overflow-hidden">
                <TransactionsList 
                  transactions={transactions} 
                  onEdit={handleEditTransaction}
                  showCard={false}
                />
              </div>

              {/* Infinite scroll trigger */}
              <div ref={observerTarget} className="py-6 flex flex-col items-center gap-3">
                {loadingMore && (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                )}
                {hasMore && !loadingMore && (
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    className="w-full max-w-xs"
                  >
                    Cargar más transacciones
                  </Button>
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
        />
      </PullToRefresh>
    </AppLayout>
  );
};

export default Transactions;
