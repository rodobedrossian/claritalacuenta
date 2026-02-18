import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Check, X, AlertTriangle, XCircle } from "lucide-react";
import { BudgetWithSpending } from "@/hooks/useBudgetsData";
import { useIsMobile } from "@/hooks/use-mobile";
import { getIconForCategory, getCategoryColor } from "@/lib/categoryIcons";

interface BudgetsTableProps {
  budgets: BudgetWithSpending[];
  onUpdate: (id: string, budget: { monthly_limit?: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const formatCurrency = (amount: number, currency: string) => {
  return `${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
};

const getCategoryStatusIcon = (percentage: number, categoryName: string) => {
  if (percentage >= 100) return <XCircle className="h-4 w-4 text-destructive" />;
  if (percentage >= 80) return <AlertTriangle className="h-4 w-4 text-warning" />;
  const IconComponent = getIconForCategory(categoryName);
  const color = getCategoryColor(categoryName);
  return <IconComponent className="h-4 w-4" style={{ color }} />;
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return "bg-destructive";
  if (percentage >= 80) return "bg-warning";
  return "bg-primary";
};

export const BudgetsTable = ({ budgets, onUpdate, onDelete }: BudgetsTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleEdit = (budget: BudgetWithSpending) => {
    setEditingId(budget.id);
    setEditValue(budget.monthly_limit.toString());
  };

  const handleSave = async (id: string) => {
    const limit = parseFloat(editValue);
    if (!isNaN(limit) && limit > 0) {
      await onUpdate(id, { monthly_limit: limit });
    }
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  if (budgets.length === 0) {
    return (
      <Card className="p-8 border-border/30 rounded-2xl">
        <p className="text-center text-muted-foreground">
          No hay presupuestos configurados. Crea uno para comenzar a controlar tus gastos.
        </p>
      </Card>
    );
  }

  const deleteDialog = (
    <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El presupuesto será eliminado permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (deleteId) onDelete(deleteId);
              setDeleteId(null);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {budgets.map((budget) => (
            <Card key={budget.id} className="p-4 rounded-2xl border-border/30 bg-card">
              {/* Row 1: Category + Currency */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getCategoryStatusIcon(budget.percentage, budget.category)}
                  <span className="font-semibold text-sm">{budget.category}</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{budget.currency}</span>
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(budget.percentage)}`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Simplified: % used + Available */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{budget.percentage.toFixed(0)}% usado</span>
                {editingId === budget.id ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-24 h-7 text-xs"
                      autoFocus
                    />
                  </div>
                ) : (
                  <span className={`text-xs font-medium ${budget.monthly_limit - budget.spent < 0 ? 'text-destructive' : 'text-foreground'}`}>
                    Disp: {formatCurrency(Math.max(0, budget.monthly_limit - budget.spent), budget.currency)}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-1">
                {editingId === budget.id ? (
                  <>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSave(budget.id)}>
                      <Check className="h-4 w-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(budget)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteId(budget.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
        {deleteDialog}
      </>
    );
  }

  // Desktop table
  return (
    <>
      <Card className="border-border/30 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead className="text-right">Límite</TableHead>
              <TableHead className="text-right">Gastado</TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead className="w-[200px]">Progreso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgets.map((budget) => (
              <TableRow key={budget.id}>
                <TableCell>{getCategoryStatusIcon(budget.percentage, budget.category)}</TableCell>
                <TableCell className="font-medium">{budget.category}</TableCell>
                <TableCell>{budget.currency}</TableCell>
                <TableCell className="text-right">
                  {editingId === budget.id ? (
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-28 ml-auto"
                      autoFocus
                    />
                  ) : (
                    formatCurrency(budget.monthly_limit, budget.currency)
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(budget.spent, budget.currency)}
                </TableCell>
                <TableCell className="text-right">
                  <span className={budget.monthly_limit - budget.spent < 0 ? "text-destructive" : ""}>
                    {formatCurrency(Math.max(0, budget.monthly_limit - budget.spent), budget.currency)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all ${getProgressColor(budget.percentage)}`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {budget.percentage.toFixed(0)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {editingId === budget.id ? (
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleSave(budget.id)}>
                        <Check className="h-4 w-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleCancel}>
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(budget)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(budget.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {deleteDialog}
    </>
  );
};
