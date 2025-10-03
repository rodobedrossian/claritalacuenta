import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionsList } from "@/components/TransactionsList";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: "USD" | "ARS";
  category: string;
  description: string;
  date: string;
  user_id: string;
}

interface DbTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  user_id: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 20;

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string | null }>>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Filter states
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Reset and refetch when filters change
    setTransactions([]);
    setPage(0);
    setHasMore(true);
    fetchTransactions(0);
  }, [filterType, filterCategory, filterUser, filterStartDate, filterEndDate]);

  const fetchInitialData = async () => {
    try {
      // Fetch users/profiles
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      if (usersData) {
        setUsers(usersData);
      }

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("name")
        .order("name");
      if (categoriesData) {
        setCategories(categoriesData.map(c => c.name));
      }

      // Fetch first page of transactions
      await fetchTransactions(0);
    } catch (error: any) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load data");
    }
  };

  const fetchTransactions = async (pageNum: number) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .order("date", { ascending: false });

      // Apply filters
      if (filterType !== "all") {
        query = query.eq("type", filterType);
      }
      if (filterCategory !== "all") {
        query = query.eq("category", filterCategory);
      }
      if (filterUser !== "all") {
        query = query.eq("user_id", filterUser);
      }
      if (filterStartDate) {
        query = query.gte("date", filterStartDate);
      }
      if (filterEndDate) {
        query = query.lte("date", filterEndDate);
      }

      // Pagination
      const from = pageNum * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: transactionsData, count } = await query;
      
      if (transactionsData) {
        const typedTransactions: Transaction[] = (transactionsData as DbTransaction[]).map(t => ({
          ...t,
          type: t.type as "income" | "expense",
          currency: t.currency as "USD" | "ARS",
          amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount
        }));
        
        setTransactions(prev => pageNum === 0 ? typedTransactions : [...prev, ...typedTransactions]);
        setTotalCount(count || 0);
        setHasMore(typedTransactions.length === ITEMS_PER_PAGE);
        setPage(pageNum);
      }
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchTransactions(page + 1);
    }
  }, [isLoading, hasMore, page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
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
  }, [loadMore]);

  const handleUpdateTransaction = async (id: string, transaction: Omit<Transaction, "id">) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          user_id: transaction.user_id
        })
        .eq("id", id);

      if (error) throw error;

      const updatedTransaction = { ...transaction, id };
      handleTransactionUpdate(updatedTransaction);
      toast.success("Transaction updated successfully");
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      handleTransactionDelete(id);
      toast.success("Transaction deleted successfully");
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  const resetFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
    setFilterUser("all");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  const handleTransactionUpdate = (updatedTransaction: Transaction) => {
    setTransactions(transactions.map(t => 
      t.id === updatedTransaction.id ? updatedTransaction : t
    ));
  };

  const handleTransactionDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    setTotalCount(prev => prev - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              title="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">All Transactions</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Filters Section */}
        <div className="mb-6 p-6 rounded-lg bg-card border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Owner</label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {transactions.length} of {totalCount} transactions
            </p>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Transactions List */}
        <TransactionsList 
          transactions={transactions} 
          onEdit={handleEditTransaction}
        />

        {/* Infinite scroll trigger */}
        <div ref={observerTarget} className="py-8 flex justify-center">
          {isLoading && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
          {!hasMore && transactions.length > 0 && (
            <p className="text-sm text-muted-foreground">No more transactions</p>
          )}
        </div>
      </main>

      <EditTransactionDialog
        transaction={editingTransaction}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdate={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
        categories={categories}
        users={users}
      />
    </div>
  );
};

export default Transactions;
