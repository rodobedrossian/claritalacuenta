import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Search, Check } from "lucide-react";
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
  onBack 
}: StatementDetailProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [itemCategories, setItemCategories] = useState<Record<string, string>>({});

  // Transform extracted_data into a flat list of items
  const extractedItems = useMemo((): ExtractedItem[] => {
    const items: ExtractedItem[] = [];
    const data = statement.extracted_data;
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
  }, [statement.extracted_data]);

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

  const handleCategoryChange = (itemId: string, category: string) => {
    setItemCategories(prev => ({ ...prev, [itemId]: category }));
    toast.success("Categoría asignada");
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

  const handleBulkUpdate = () => {
    if (selectedIds.size === 0 || !bulkCategory) return;
    
    const newCategories = { ...itemCategories };
    selectedIds.forEach(id => {
      newCategories[id] = bulkCategory;
    });
    setItemCategories(newCategories);
    setSelectedIds(new Set());
    setBulkCategory("");
    toast.success(`${selectedIds.size} items categorizados`);
  };

  const expenseCategories = categories.filter(c => c.type === "expense" || c.type === "both");

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
                    <Select 
                      value={itemCategories[item.id] || ""} 
                      onValueChange={(value) => handleCategoryChange(item.id, value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sin categoría" />
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
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
