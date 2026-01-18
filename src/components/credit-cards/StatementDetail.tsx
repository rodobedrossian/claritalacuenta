import { useState, useMemo, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Search, Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { StatementImport, CreditCardTransaction } from "@/hooks/useCreditCardStatements";
import { supabase } from "@/integrations/supabase/client";
import { StatementSpendingChart } from "./StatementSpendingChart";

interface Category {
  id: string;
  name: string;
  type: string;
}

// Type for extracted_data structure (still used for resumen/summary)
interface ExtractedDataType {
  resumen?: {
    total_ars?: number;
    total_usd?: number;
    fecha_vencimiento?: string;
    fecha_cierre?: string;
  };
}

interface StatementDetailProps {
  statement: StatementImport;
  categories: Category[];
  userId: string;
  onBack: () => void;
  onStatementUpdated?: (updatedStatement: StatementImport) => void;
}

type FilterType = "all" | "consumo" | "cuota" | "impuesto";
type TransactionType = "consumo" | "cuota" | "impuesto";

// Normalize description for matching (remove extra spaces, lowercase)
const normalizeDescription = (desc: string): string => {
  return desc.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Extract installment info from description like "MERPAGO*KORA (1/3)"
const extractInstallmentInfo = (description: string): { current: number; total: number } | null => {
  const match = description.match(/\((\d+)\/(\d+)\)/);
  if (match) {
    return {
      current: parseInt(match[1], 10),
      total: parseInt(match[2], 10)
    };
  }
  return null;
};

export const StatementDetail = ({ 
  statement, 
  categories,
  userId,
  onBack,
}: StatementDetailProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [transactions, setTransactions] = useState<CreditCardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [learnedCategories, setLearnedCategories] = useState<Record<string, string>>({});
  const [autoAssignedCount, setAutoAssignedCount] = useState(0);

  // Load transactions from credit_card_transactions table
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("credit_card_transactions")
        .select("*")
        .eq("statement_import_id", statement.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error loading transactions:", error);
        toast.error("Error al cargar las transacciones");
      } else {
        setTransactions(data || []);
      }
      setLoading(false);
    };

    loadTransactions();
  }, [statement.id]);

  // Load learned categories from previous transactions (once)
  useEffect(() => {
    const loadLearnedCategories = async () => {
      const { data: ccTransactions } = await supabase
        .from('credit_card_transactions')
        .select('description, category_id')
        .eq('user_id', userId)
        .not('category_id', 'is', null)
        .order('created_at', { ascending: false });

      if (!ccTransactions) return;

      // Build a map of description -> category_id (most recent wins)
      const categoryMap: Record<string, string> = {};
      ccTransactions.forEach(t => {
        const normalized = normalizeDescription(t.description);
        if (!categoryMap[normalized] && t.category_id) {
          categoryMap[normalized] = t.category_id;
        }
      });

      setLearnedCategories(categoryMap);
    };

    loadLearnedCategories();
  }, [userId]);

  // Auto-assign categories based on learned categories
  useEffect(() => {
    if (transactions.length === 0 || Object.keys(learnedCategories).length === 0) return;

    // Find transactions without categories that can be auto-assigned
    const toAutoAssign: { id: string; categoryId: string }[] = [];
    
    transactions.forEach(tx => {
      if (tx.category_id) return; // Already has category
      
      const normalized = normalizeDescription(tx.description);
      const learned = learnedCategories[normalized];
      
      if (learned) {
        toAutoAssign.push({ id: tx.id, categoryId: learned });
      }
    });

    if (toAutoAssign.length === 0) return;

    // Apply auto-assignments
    const applyAutoAssignments = async () => {
      const updatePromises = toAutoAssign.map(({ id, categoryId }) =>
        supabase
          .from("credit_card_transactions")
          .update({ category_id: categoryId })
          .eq("id", id)
      );

      await Promise.all(updatePromises);

      // Update local state
      setTransactions(prev =>
        prev.map(tx => {
          const assignment = toAutoAssign.find(a => a.id === tx.id);
          return assignment ? { ...tx, category_id: assignment.categoryId } : tx;
        })
      );

      setAutoAssignedCount(toAutoAssign.length);
    };

    applyAutoAssignments();
  }, [transactions.length, learnedCategories]);

  // Build categoryOptions 
  const categoryOptions = useMemo(() => {
    const expenseCats = categories.filter(c => c.type === "expense" || c.type === "both");
    return expenseCats.map(c => ({ id: c.id, name: c.name }));
  }, [categories]);

  // Build category ID to name map for display
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(c => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // Helper to get category name from ID
  const getCategoryName = useCallback((categoryId: string | null | undefined): string => {
    if (!categoryId) return "";
    return categoryNameMap.get(categoryId) || categoryId;
  }, [categoryNameMap]);

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "consumo":
        return "default";
      case "cuota":
        return "secondary";
      case "impuesto":
        return "outline";
      default:
        return "default";
    }
  };

  const filteredItems = transactions.filter((item) => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || item.transaction_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleCategoryChange = async (transactionId: string, categoryId: string) => {
    // Find the current transaction's description
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const normalizedDesc = normalizeDescription(transaction.description);
    
    // Find all transactions with the same description
    const matchingTransactions = transactions.filter(
      t => normalizeDescription(t.description) === normalizedDesc
    );

    // Update all matching transactions in the database
    const updatePromises = matchingTransactions.map(tx =>
      supabase
        .from("credit_card_transactions")
        .update({ category_id: categoryId })
        .eq("id", tx.id)
    );

    await Promise.all(updatePromises);

    // Update local state
    setTransactions(prev =>
      prev.map(tx => {
        const isMatch = normalizeDescription(tx.description) === normalizedDesc;
        return isMatch ? { ...tx, category_id: categoryId } : tx;
      })
    );

    // Update local learned categories map for future matches
    setLearnedCategories(prev => ({
      ...prev,
      [normalizedDesc]: categoryId
    }));

    const count = matchingTransactions.length;
    if (count > 1) {
      toast.success(`Categoría asignada a ${count} consumos similares`);
    } else {
      toast.success("Categoría asignada");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredItems.map(item => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleTransactionTypeChange = async (transactionId: string, newType: TransactionType) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    // Extract installment info if changing to cuota
    let installmentData: { installment_current: number | null; installment_total: number | null } = {
      installment_current: null,
      installment_total: null
    };

    if (newType === "cuota") {
      const info = extractInstallmentInfo(transaction.description);
      if (info) {
        installmentData = {
          installment_current: info.current,
          installment_total: info.total
        };
      }
    }

    // Update in database
    const { error } = await supabase
      .from("credit_card_transactions")
      .update({ 
        transaction_type: newType,
        ...installmentData
      })
      .eq("id", transactionId);

    if (error) {
      console.error("Error updating transaction type:", error);
      toast.error("Error al actualizar el tipo");
      return;
    }

    // Update local state
    setTransactions(prev =>
      prev.map(tx => 
        tx.id === transactionId 
          ? { 
              ...tx, 
              transaction_type: newType,
              installment_current: installmentData.installment_current,
              installment_total: installmentData.installment_total
            } 
          : tx
      )
    );

    toast.success(`Tipo cambiado a ${newType}`);
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0 || !bulkCategory) return;
    
    // Update in database
    const { error } = await supabase
      .from("credit_card_transactions")
      .update({ category_id: bulkCategory })
      .in("id", Array.from(selectedIds));

    if (error) {
      console.error("Error bulk updating categories:", error);
      toast.error("Error al actualizar categorías");
      return;
    }

    // Update local state
    setTransactions(prev =>
      prev.map(tx => selectedIds.has(tx.id) ? { ...tx, category_id: bulkCategory } : tx)
    );
    
    // Update learned categories for bulk items
    selectedIds.forEach(id => {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        const normalized = normalizeDescription(tx.description);
        setLearnedCategories(prev => ({ ...prev, [normalized]: bulkCategory }));
      }
    });
    
    setSelectedIds(new Set());
    setBulkCategory("");
    toast.success(`${selectedIds.size} items categorizados`);
  };

  const extractedData = statement.extracted_data as ExtractedDataType | null;
  const totalArs = extractedData?.resumen?.total_ars || 0;
  const totalUsd = extractedData?.resumen?.total_usd || 0;

  // Build chart data from transactions
  const chartItems = useMemo(() => {
    return transactions.map(tx => ({
      descripcion: tx.description,
      monto: tx.amount,
      moneda: tx.currency,
    }));
  }, [transactions]);

  // Build itemCategories map for chart (using category_id directly)
  const itemCategories = useMemo(() => {
    const map: Record<string, string> = {};
    transactions.forEach((tx, index) => {
      // Use index-based ID to match chart items
      const key = tx.description; // Chart uses description as key
      if (tx.category_id) {
        map[key] = tx.category_id;
      }
    });
    return map;
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">
            Resumen de {format(parseISO(statement.statement_month), "MMMM yyyy", { locale: es })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {statement.file_name}
          </p>
        </div>
      </div>

      {/* Auto-assign notification */}
      {autoAssignedCount > 0 && (
        <Card className="p-3 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>
              <strong>{autoAssignedCount}</strong> categorías asignadas automáticamente basadas en consumos anteriores
            </span>
          </div>
        </Card>
      )}

      {/* Summary Card */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total ARS</p>
            <p className="text-lg font-bold text-warning">
              {totalArs > 0 ? formatCurrency(totalArs, "ARS") : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total USD</p>
            <p className="text-lg font-bold text-warning">
              {totalUsd > 0 ? formatCurrency(totalUsd, "USD") : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Transacciones</p>
            <p className="text-lg font-bold">{transactions.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fecha cierre</p>
            <p className="text-lg font-bold">
              {extractedData?.resumen?.fecha_cierre || "-"}
            </p>
          </div>
        </div>
      </Card>

      {/* Spending by Category Chart */}
      <StatementSpendingChart items={chartItems} itemCategories={itemCategories} categories={categories} />

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "consumo", "cuota", "impuesto"] as FilterType[]).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
            >
              {type === "all" ? "Todos" : type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedIds.size} seleccionados
            </span>
            <Select value={bulkCategory} onValueChange={setBulkCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Asignar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              onClick={handleBulkUpdate}
              disabled={!bulkCategory}
            >
              <Check className="h-4 w-4 mr-1" />
              Aplicar
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Items Table */}
      {filteredItems.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {transactions.length === 0 
              ? "No hay transacciones para este resumen"
              : "No se encontraron items con los filtros aplicados"}
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Categoría</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={(checked) => handleSelectOne(item.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {item.date || "-"}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {item.description}
                    {item.installment_current && item.installment_total && (
                      <span className="text-muted-foreground ml-1">
                        ({item.installment_current}/{item.installment_total})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={item.transaction_type} 
                      onValueChange={(value: TransactionType) => handleTransactionTypeChange(item.id, value)}
                    >
                      <SelectTrigger className="w-[110px] h-8">
                        <Badge variant={getBadgeVariant(item.transaction_type)} className="w-full justify-center">
                          {item.transaction_type}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consumo">
                          <Badge variant="default">consumo</Badge>
                        </SelectItem>
                        <SelectItem value="cuota">
                          <Badge variant="secondary">cuota</Badge>
                        </SelectItem>
                        <SelectItem value="impuesto">
                          <Badge variant="outline">impuesto</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {formatCurrency(item.amount, item.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Select 
                        value={item.category_id || ""} 
                        onValueChange={(value) => handleCategoryChange(item.id, value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Sin categoría">
                            {getCategoryName(item.category_id) || "Sin categoría"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {item.category_id && 
                       learnedCategories[normalizeDescription(item.description)] === item.category_id && (
                        <span title="Auto-asignada">
                          <Sparkles className="h-3 w-3 text-primary" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
