import { useState, useMemo, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Search, Check, Sparkles, Loader2, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { StatementImport, CreditCardTransaction } from "@/hooks/useCreditCardStatements";
import { supabase } from "@/integrations/supabase/client";
import { StatementSpendingChart } from "./StatementSpendingChart";

interface Category {
  id: string;
  name: string;
  type: string;
}

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
  onDeleteStatement?: (statementId: string, filePath?: string | null) => Promise<boolean>;
  onStatementUpdated?: (updatedStatement: StatementImport) => void;
}

type FilterType = "all" | "consumo" | "cuota" | "impuesto";
type TransactionType = "consumo" | "cuota" | "impuesto";

const normalizeDescription = (desc: string): string => {
  return desc.toLowerCase().trim().replace(/\s+/g, ' ');
};

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
  onDeleteStatement,
}: StatementDetailProps) => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [transactions, setTransactions] = useState<CreditCardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [learnedCategories, setLearnedCategories] = useState<Record<string, string>>({});
  const [autoAssignedCount, setAutoAssignedCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    const loadLearnedCategories = async () => {
      const { data: ccTransactions } = await supabase
        .from('credit_card_transactions')
        .select('description, category_id')
        .eq('user_id', userId)
        .not('category_id', 'is', null)
        .order('created_at', { ascending: false });

      if (!ccTransactions) return;

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

  useEffect(() => {
    if (transactions.length === 0 || Object.keys(learnedCategories).length === 0) return;

    const toAutoAssign: { id: string; categoryId: string }[] = [];
    
    transactions.forEach(tx => {
      if (tx.category_id) return;
      const normalized = normalizeDescription(tx.description);
      const learned = learnedCategories[normalized];
      if (learned) {
        toAutoAssign.push({ id: tx.id, categoryId: learned });
      }
    });

    if (toAutoAssign.length === 0) return;

    const applyAutoAssignments = async () => {
      const updatePromises = toAutoAssign.map(({ id, categoryId }) =>
        supabase
          .from("credit_card_transactions")
          .update({ category_id: categoryId })
          .eq("id", id)
      );

      await Promise.all(updatePromises);

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

  const categoryOptions = useMemo(() => {
    const expenseCats = categories.filter(c => c.type === "expense" || c.type === "both");
    return expenseCats.map(c => ({ id: c.id, name: c.name }));
  }, [categories]);

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(c => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const getCategoryName = useCallback((categoryId: string | null | undefined): string => {
    if (!categoryId) return "";
    return categoryNameMap.get(categoryId) || categoryId;
  }, [categoryNameMap]);

  const formatCurrency = (amount: number, currency: string) => {
    const isNegative = amount < 0;
    const formattedAmount = new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    return `${currency} ${isNegative ? "-" : ""}${formattedAmount}`;
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "consumo": return "default";
      case "cuota": return "secondary";
      case "impuesto": return "outline";
      default: return "default";
    }
  };

  const filteredItems = transactions.filter((item) => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || item.transaction_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleCategoryChange = async (transactionId: string, categoryId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const normalizedDesc = normalizeDescription(transaction.description);
    const matchingTransactions = transactions.filter(
      t => normalizeDescription(t.description) === normalizedDesc
    );

    const updatePromises = matchingTransactions.map(tx =>
      supabase
        .from("credit_card_transactions")
        .update({ category_id: categoryId })
        .eq("id", tx.id)
    );

    await Promise.all(updatePromises);

    setTransactions(prev =>
      prev.map(tx => {
        const isMatch = normalizeDescription(tx.description) === normalizedDesc;
        return isMatch ? { ...tx, category_id: categoryId } : tx;
      })
    );

    setLearnedCategories(prev => ({
      ...prev,
      [normalizedDesc]: categoryId
    }));

    if (matchingTransactions.length > 1) {
      toast.success(`Categoría asignada a ${matchingTransactions.length} consumos similares`);
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
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleTransactionTypeChange = async (transactionId: string, newType: TransactionType) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

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

    const { error } = await supabase
      .from("credit_card_transactions")
      .update({ 
        transaction_type: newType,
        ...installmentData
      })
      .eq("id", transactionId);

    if (error) {
      toast.error("Error al actualizar el tipo");
      return;
    }

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
    
    const { error } = await supabase
      .from("credit_card_transactions")
      .update({ category_id: bulkCategory })
      .in("id", Array.from(selectedIds));

    if (error) {
      toast.error("Error al actualizar categorías");
      return;
    }

    setTransactions(prev =>
      prev.map(tx => selectedIds.has(tx.id) ? { ...tx, category_id: bulkCategory } : tx)
    );
    
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
  const totalArs = useMemo(() => 
    transactions.filter(t => t.currency === "ARS").reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  const totalUsd = useMemo(() => 
    transactions.filter(t => t.currency === "USD").reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const chartItems = useMemo(() => {
    return transactions.map(tx => ({
      descripcion: tx.description,
      monto: tx.amount,
      moneda: tx.currency,
    }));
  }, [transactions]);

  const itemCategories = useMemo(() => {
    const map: Record<string, string> = {};
    transactions.forEach((tx) => {
      if (tx.category_id) {
        map[tx.description] = tx.category_id;
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
      {/* Header - Fixed sticky with safe area */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pt-safe pb-3 transition-all duration-300">
        <div className="flex items-center justify-between gap-4 h-10">
          <div className="flex items-center gap-4 min-w-0">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col min-w-0">
              <h2 className="text-xl font-bold tracking-tight">
                {format(parseISO(statement.statement_month), "MMMM yyyy", { locale: es })}
              </h2>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate max-w-[200px] sm:max-w-none">
                {statement.file_name}
              </p>
            </div>
          </div>
          {onDeleteStatement && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar resumen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminarán todas las transacciones asociadas (consumos y pagos de tarjeta). Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      setIsDeleting(true);
                      try {
                        const ok = await onDeleteStatement(statement.id, statement.file_path);
                        if (ok) {
                          toast.success("Resumen eliminado");
                          onBack();
                        } else {
                          toast.error("Error al eliminar el resumen");
                        }
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="space-y-6 pt-2">
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

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total ARS</p>
              <p className="text-lg font-bold text-warning">
                {transactions.some(t => t.currency === "ARS") ? formatCurrency(totalArs, "ARS") : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total USD</p>
              <p className="text-lg font-bold text-warning">
                {transactions.some(t => t.currency === "USD") ? formatCurrency(totalUsd, "USD") : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transacciones</p>
              <p className="text-lg font-bold">{transactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha cierre</p>
              <p className="text-lg font-bold">{extractedData?.resumen?.fecha_cierre || "-"}</p>
            </div>
          </div>
        </Card>

        <StatementSpendingChart items={chartItems} itemCategories={itemCategories} categories={categories} />

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Buscar por descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mb-1 md:overflow-visible md:pb-0 md:mb-0">
            {(["all", "consumo", "cuota", "impuesto"] as FilterType[]).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type)}
                className="shrink-0"
              >
                {type === "all" ? "Todos" : type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {selectedIds.size > 0 && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <span className="text-sm font-medium shrink-0">{selectedIds.size} seleccionados</span>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={bulkCategory} onValueChange={setBulkCategory}>
                  <SelectTrigger className="w-full sm:w-[200px] min-w-0">
                    <SelectValue placeholder="Asignar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleBulkUpdate} disabled={!bulkCategory} className="shrink-0">
                  <Check className="h-4 w-4 mr-1" /> Aplicar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="shrink-0">Cancelar</Button>
              </div>
            </div>
          </Card>
        )}

        {isMobile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <button
                type="button"
                onClick={() => handleSelectAll(selectedIds.size === filteredItems.length)}
                className="text-sm font-medium text-primary hover:underline"
              >
                {selectedIds.size === filteredItems.length && filteredItems.length > 0
                  ? "Deseleccionar todo"
                  : "Seleccionar todo"}
              </button>
              <span className="text-xs text-muted-foreground">
                {selectedIds.size} de {filteredItems.length}
              </span>
            </div>
            <div className="space-y-2">
            {filteredItems.map((item) => (
              <TransactionCard
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={(checked) => handleSelectOne(item.id, checked)}
                onTypeChange={(v) => handleTransactionTypeChange(item.id, v as TransactionType)}
                onCategoryChange={(v) => handleCategoryChange(item.id, v)}
                getCategoryName={getCategoryName}
                formatCurrency={formatCurrency}
                categoryOptions={categoryOptions}
              />
            ))}
            </div>
          </div>
        ) : (
        <div className="rounded-lg border border-border/50 overflow-x-auto no-scrollbar">
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
                  <TableCell className="whitespace-nowrap">{item.date || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {item.description}
                    {item.installment_current && item.installment_total && (
                      <span className="text-muted-foreground ml-1">({item.installment_current}/{item.installment_total})</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select value={item.transaction_type} onValueChange={(v: TransactionType) => handleTransactionTypeChange(item.id, v)}>
                      <SelectTrigger className="w-[110px] h-8">
                        <Badge variant={getBadgeVariant(item.transaction_type)} className="w-full justify-center">{item.transaction_type}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consumo"><Badge variant="default">consumo</Badge></SelectItem>
                        <SelectItem value="cuota"><Badge variant="secondary">cuota</Badge></SelectItem>
                        <SelectItem value="impuesto"><Badge variant="outline">impuesto</Badge></SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className={`whitespace-nowrap font-medium ${item.amount < 0 ? "text-green-500" : ""}`}>
                    {formatCurrency(item.amount, item.currency)}
                  </TableCell>
                  <TableCell>
                    <Select value={item.category_id || ""} onValueChange={(v) => handleCategoryChange(item.id, v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Sin categoría">{getCategoryName(item.category_id) || "Sin categoría"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}

        {/* Spacer to clear bottom nav */}
        <div className="h-[calc(72px+env(safe-area-inset-bottom,0)+2rem)] md:hidden" />
      </div>
    </div>
  );
};

interface TransactionCardProps {
  item: CreditCardTransaction;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onTypeChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  getCategoryName: (id: string | null | undefined) => string;
  formatCurrency: (amount: number, currency: string) => string;
  categoryOptions: { id: string; name: string }[];
}

function TransactionCard({
  item,
  isSelected,
  onToggleSelect,
  onTypeChange,
  onCategoryChange,
  getCategoryName,
  formatCurrency,
  categoryOptions,
}: TransactionCardProps) {
  return (
    <Card className="p-4 border-border/50">
      <div className="flex gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          className="mt-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-medium text-sm leading-tight line-clamp-2">{item.description}</p>
            <span className={`text-sm font-semibold shrink-0 ${item.amount < 0 ? "text-green-600 dark:text-green-500" : ""}`}>
              {formatCurrency(item.amount, item.currency)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{item.date || "-"}</span>
            {item.installment_current && item.installment_total && (
              <span>({item.installment_current}/{item.installment_total})</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
          <Select value={item.transaction_type} onValueChange={onTypeChange}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consumo">consumo</SelectItem>
              <SelectItem value="cuota">cuota</SelectItem>
              <SelectItem value="impuesto">impuesto</SelectItem>
            </SelectContent>
          </Select>
          <Select value={item.category_id || ""} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Sin categoría">
                {getCategoryName(item.category_id) || "Sin categoría"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>
      </div>
    </Card>
  );
}
