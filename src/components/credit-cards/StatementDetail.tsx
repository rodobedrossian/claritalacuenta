import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Search, Check, Sparkles } from "lucide-react";
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
import { StatementImport } from "@/hooks/useCreditCardStatements";
import { supabase } from "@/integrations/supabase/client";
import { StatementSpendingChart } from "./StatementSpendingChart";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface ExtractedItem {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  moneda: string;
  tipo: "consumo" | "cuota" | "impuesto";
  cuota_actual?: number | null;
  total_cuotas?: number | null;
}

// Type for extracted_data structure
interface ExtractedDataType {
  consumos?: Array<{
    fecha: string;
    descripcion: string;
    monto: number;
    moneda: string;
  }>;
  cuotas?: Array<{
    fecha: string;
    descripcion: string;
    monto: number;
    moneda: string;
    cuota_actual: number;
    total_cuotas: number;
  }>;
  impuestos?: Array<{
    descripcion: string;
    monto: number;
    moneda: string;
  }>;
  resumen?: {
    total_ars?: number;
    total_usd?: number;
    fecha_vencimiento?: string;
    fecha_cierre?: string;
  };
  categorias_asignadas?: Record<string, string>;
}

interface StatementDetailProps {
  statement: StatementImport;
  categories: Category[];
  userId: string;
  onBack: () => void;
  onStatementUpdated?: (updatedStatement: StatementImport) => void;
}

type FilterType = "all" | "consumo" | "cuota" | "impuesto";

// Normalize description for matching (remove extra spaces, lowercase)
const normalizeDescription = (desc: string): string => {
  return desc.toLowerCase().trim().replace(/\s+/g, ' ');
};

export const StatementDetail = ({ 
  statement, 
  categories,
  userId,
  onBack,
  onStatementUpdated
}: StatementDetailProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [itemCategories, setItemCategories] = useState<Record<string, string>>({});
  const [learnedCategories, setLearnedCategories] = useState<Record<string, string>>({});
  const [autoAssignedCount, setAutoAssignedCount] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Track local extracted_data to prevent stale state
  const [localExtractedData, setLocalExtractedData] = useState<ExtractedDataType>(
    statement.extracted_data as ExtractedDataType || {}
  );
  
  // Refs to prevent duplicate runs
  const autoAssignRan = useRef(false);
  const learnedCategoriesLoaded = useRef(false);

  // Load saved categories from extracted_data on mount
  useEffect(() => {
    const data = localExtractedData as Record<string, unknown> | null;
    const savedCategories = data?.categorias_asignadas;
    if (savedCategories && typeof savedCategories === 'object') {
      setItemCategories(savedCategories as Record<string, string>);
    }
    setDataLoaded(true);
  }, []);

  // Load learned categories from previous transactions (once)
  useEffect(() => {
    if (learnedCategoriesLoaded.current) return;
    learnedCategoriesLoaded.current = true;

    const loadLearnedCategories = async () => {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('description, category')
        .eq('user_id', userId)
        .not('category', 'is', null)
        .not('category', 'eq', '')
        .order('created_at', { ascending: false });

      if (!transactions) return;

      // Build a map of description -> category (most recent wins)
      const categoryMap: Record<string, string> = {};
      transactions.forEach(t => {
        const normalized = normalizeDescription(t.description);
        if (!categoryMap[normalized]) {
          categoryMap[normalized] = t.category;
        }
      });

      setLearnedCategories(categoryMap);
    };

    loadLearnedCategories();
  }, [userId]);

  // Transform extracted_data into a flat list of items
  const extractedItems = useMemo((): ExtractedItem[] => {
    const items: ExtractedItem[] = [];
    const data = localExtractedData;
    if (!data) return items;

    let idCounter = 0;

    // Add consumos
    (data.consumos || []).forEach((c) => {
      items.push({
        id: `consumo_${idCounter++}`,
        fecha: c.fecha,
        descripcion: c.descripcion,
        monto: c.monto,
        moneda: c.moneda || "ARS",
        tipo: "consumo",
      });
    });

    // Add cuotas
    (data.cuotas || []).forEach((c) => {
      items.push({
        id: `cuota_${idCounter++}`,
        fecha: c.fecha,
        descripcion: c.descripcion,
        monto: c.monto,
        moneda: c.moneda || "ARS",
        tipo: "cuota",
        cuota_actual: c.cuota_actual,
        total_cuotas: c.total_cuotas,
      });
    });

    // Add impuestos
    (data.impuestos || []).forEach((i) => {
      items.push({
        id: `impuesto_${idCounter++}`,
        fecha: "",
        descripcion: i.descripcion,
        monto: i.monto,
        moneda: i.moneda || "ARS",
        tipo: "impuesto",
      });
    });

    return items;
  }, [localExtractedData]);

  // Build categoryOptions as union of: categories table + saved itemCategories + learnedCategories
  const categoryOptions = useMemo(() => {
    const expenseCats = categories.filter(c => c.type === "expense" || c.type === "both");
    const namesFromTable = new Set(expenseCats.map(c => c.name));
    
    // Add any saved categories not in the table
    const additionalNames = new Set<string>();
    Object.values(itemCategories).forEach(cat => {
      if (cat && !namesFromTable.has(cat)) {
        additionalNames.add(cat);
      }
    });
    Object.values(learnedCategories).forEach(cat => {
      if (cat && !namesFromTable.has(cat)) {
        additionalNames.add(cat);
      }
    });

    // Combine: table categories first, then additional
    const options = expenseCats.map(c => ({ id: c.id, name: c.name }));
    additionalNames.forEach(name => {
      options.push({ id: `custom_${name}`, name });
    });

    return options;
  }, [categories, itemCategories, learnedCategories]);

  // Persist categories to database with proper error handling
  const persistCategories = useCallback(async (newCategories: Record<string, string>) => {
    const updatedData = {
      ...localExtractedData,
      categorias_asignadas: newCategories
    };

    const { data, error } = await supabase
      .from('statement_imports')
      .update({ extracted_data: updatedData })
      .eq('id', statement.id)
      .select('extracted_data')
      .single();

    if (error) {
      console.error("Error persisting categories:", error);
      toast.error("Error al guardar las categorías");
      return;
    }

    // Update local state with DB response (with type assertion)
    if (data?.extracted_data && typeof data.extracted_data === 'object' && !Array.isArray(data.extracted_data)) {
      const extractedData = data.extracted_data as ExtractedDataType;
      setLocalExtractedData(extractedData);
      // Notify parent if callback exists
      if (onStatementUpdated) {
        onStatementUpdated({
          ...statement,
          extracted_data: extractedData
        });
      }
    }
  }, [localExtractedData, statement, onStatementUpdated]);

  // Auto-assign categories based on learned categories (runs once after data is loaded)
  useEffect(() => {
    if (autoAssignRan.current) return;
    if (!dataLoaded) return;
    if (Object.keys(learnedCategories).length === 0 || extractedItems.length === 0) return;

    autoAssignRan.current = true;

    // Use functional update to get current itemCategories state
    setItemCategories(currentCategories => {
      const toAssign: Record<string, string> = {};
      
      extractedItems.forEach(item => {
        const normalized = normalizeDescription(item.descripcion);
        const learned = learnedCategories[normalized];
        
        // Only assign if there's a match AND no category already saved
        if (learned && !currentCategories[item.id]) {
          toAssign[item.id] = learned;
        }
      });

      const count = Object.keys(toAssign).length;
      if (count > 0) {
        const newCategories = { ...currentCategories, ...toAssign };
        setAutoAssignedCount(count);
        
        // Persist auto-assigned categories
        persistCategories(newCategories);
        
        return newCategories;
      }
      
      return currentCategories;
    });
  }, [learnedCategories, extractedItems, dataLoaded, persistCategories]);

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

  const filteredItems = extractedItems.filter((item) => {
    const matchesSearch = item.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || item.tipo === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleCategoryChange = async (itemId: string, category: string) => {
    // Find the current item's description
    const item = extractedItems.find(i => i.id === itemId);
    if (!item) return;

    const normalizedDesc = normalizeDescription(item.descripcion);
    
    // Find all items with the same description
    const matchingItems = extractedItems.filter(
      i => normalizeDescription(i.descripcion) === normalizedDesc
    );

    // Update all matching items
    const newCategories = { ...itemCategories };
    matchingItems.forEach(matchItem => {
      newCategories[matchItem.id] = category;
    });
    
    setItemCategories(newCategories);
    
    // Persist to database
    await persistCategories(newCategories);

    // Update local learned categories map for future matches
    setLearnedCategories(prev => ({
      ...prev,
      [normalizedDesc]: category
    }));

    const count = matchingItems.length;
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

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0 || !bulkCategory) return;
    
    const newCategories = { ...itemCategories };
    selectedIds.forEach(id => {
      newCategories[id] = bulkCategory;
    });
    
    setItemCategories(newCategories);
    await persistCategories(newCategories);
    
    // Update learned categories for bulk items
    selectedIds.forEach(id => {
      const item = extractedItems.find(i => i.id === id);
      if (item) {
        const normalized = normalizeDescription(item.descripcion);
        setLearnedCategories(prev => ({ ...prev, [normalized]: bulkCategory }));
      }
    });
    
    setSelectedIds(new Set());
    setBulkCategory("");
    toast.success(`${selectedIds.size} items categorizados`);
  };

  const extractedData = localExtractedData;
  const totalArs = extractedData?.resumen?.total_ars || 0;
  const totalUsd = extractedData?.resumen?.total_usd || 0;

  // Build items array for the spending chart
  const chartItems = useMemo(() => {
    const items: Array<{ descripcion: string; monto: number; moneda: string }> = [];
    const data = localExtractedData;
    if (!data) return items;

    // Add consumos
    (data.consumos || []).forEach((c) => {
      items.push({
        descripcion: c.descripcion,
        monto: c.monto,
        moneda: c.moneda || "ARS",
      });
    });

    // Add cuotas
    (data.cuotas || []).forEach((c) => {
      items.push({
        descripcion: c.descripcion,
        monto: c.monto,
        moneda: c.moneda || "ARS",
      });
    });

    // Add impuestos
    (data.impuestos || []).forEach((i) => {
      items.push({
        descripcion: i.descripcion,
        monto: i.monto,
        moneda: i.moneda || "ARS",
      });
    });

    return items;
  }, [localExtractedData]);

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
            <p className="text-sm text-muted-foreground">Items extraídos</p>
            <p className="text-lg font-bold">{extractedItems.length}</p>
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
      <StatementSpendingChart items={chartItems} itemCategories={itemCategories} />

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

      {/* Items Table */}
      {filteredItems.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {extractedItems.length === 0 
              ? "No hay datos extraídos para este resumen"
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
                    {item.fecha || "-"}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {item.descripcion}
                    {item.cuota_actual && item.total_cuotas && (
                      <span className="text-muted-foreground ml-1">
                        ({item.cuota_actual}/{item.total_cuotas})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(item.tipo)}>
                      {item.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {formatCurrency(item.monto, item.moneda)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Select 
                        value={itemCategories[item.id] || ""} 
                        onValueChange={(value) => handleCategoryChange(item.id, value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Sin categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {itemCategories[item.id] && 
                       learnedCategories[normalizeDescription(item.descripcion)] === itemCategories[item.id] && (
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
