import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Search, Check, Edit2 } from "lucide-react";
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
import { StatementImport, StatementTransaction, useCreditCardStatements } from "@/hooks/useCreditCardStatements";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface StatementDetailProps {
  statement: StatementImport;
  categories: Category[];
  userId: string;
  onBack: () => void;
}

type FilterType = "all" | "consumo" | "cuota" | "impuesto";

export const StatementDetail = ({ 
  statement, 
  categories, 
  userId,
  onBack 
}: StatementDetailProps) => {
  const [transactions, setTransactions] = useState<StatementTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  
  const { getStatementTransactions, updateTransactionCategory, bulkUpdateCategories } = useCreditCardStatements(userId);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    const txns = await getStatementTransactions(statement.id);
    setTransactions(txns);
    setLoading(false);
  }, [statement.id, getStatementTransactions]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const getTransactionType = (description: string): string => {
    if (description.toLowerCase().includes("impuesto") || 
        description.toLowerCase().includes("iva") ||
        description.toLowerCase().includes("percepcion")) {
      return "impuesto";
    }
    if (description.match(/\(\d+\/\d+\)/)) {
      return "cuota";
    }
    return "consumo";
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

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
    const type = getTransactionType(tx.description);
    const matchesFilter = filterType === "all" || type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleCategoryChange = async (transactionId: string, category: string) => {
    const success = await updateTransactionCategory(transactionId, category);
    if (success) {
      setTransactions(prev => 
        prev.map(tx => 
          tx.id === transactionId ? { ...tx, category } : tx
        )
      );
      toast.success("Categoría actualizada - Presupuesto impactado");
    } else {
      toast.error("Error al actualizar la categoría");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredTransactions.map(tx => tx.id)));
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

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0 || !bulkCategory) return;
    
    const idsArray = Array.from(selectedIds);
    const success = await bulkUpdateCategories(idsArray, bulkCategory);
    
    if (success) {
      setTransactions(prev =>
        prev.map(tx =>
          selectedIds.has(tx.id) ? { ...tx, category: bulkCategory } : tx
        )
      );
      setSelectedIds(new Set());
      setBulkCategory("");
      toast.success(`${idsArray.length} transacciones actualizadas - Presupuestos impactados`);
    } else {
      toast.error("Error al actualizar las categorías");
    }
  };

  const expenseCategories = categories.filter(c => c.type === "expense");

  const extractedData = statement.extracted_data;
  const totalArs = extractedData?.resumen?.total_ars || 0;
  const totalUsd = extractedData?.resumen?.total_usd || 0;

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
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
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

      {/* Transactions Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando transacciones...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {transactions.length === 0 
              ? "No hay transacciones importadas para este resumen"
              : "No se encontraron transacciones con los filtros aplicados"}
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
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
              {filteredTransactions.map((tx) => {
                const type = getTransactionType(tx.description);
                return (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(tx.id)}
                        onCheckedChange={(checked) => handleSelectOne(tx.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {tx.date ? format(parseISO(tx.date), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(type)}>
                        {type}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatCurrency(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={tx.category} 
                        onValueChange={(value) => handleCategoryChange(tx.id, value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
