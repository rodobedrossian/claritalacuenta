import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, Play, Pencil } from "lucide-react";
import { RecurringExpense } from "@/hooks/useRecurringExpensesData";
import { GenerateRecurringDialog } from "./GenerateRecurringDialog";
import { EditRecurringExpenseDialog } from "./EditRecurringExpenseDialog";
import { Category } from "@/hooks/useCategoriesData";

interface RecurringExpensesListProps {
  expenses: RecurringExpense[];
  categories: Category[];
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, expense: Partial<RecurringExpense>) => Promise<void>;
  onGenerate: (expense: RecurringExpense, amount?: number) => Promise<void>;
}

export function RecurringExpensesList({
  expenses,
  categories,
  onDelete,
  onUpdate,
  onGenerate,
}: RecurringExpensesListProps) {
  const [selectedExpense, setSelectedExpense] = useState<RecurringExpense | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleGenerateClick = (expense: RecurringExpense) => {
    setSelectedExpense(expense);
    setGenerateOpen(true);
  };

  const handleEditClick = (expense: RecurringExpense) => {
    setSelectedExpense(expense);
    setEditOpen(true);
  };

  const handleToggleActive = async (expense: RecurringExpense) => {
    await onUpdate(expense.id, { is_active: !expense.is_active });
  };

  if (expenses.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No hay gastos recurrentes configurados
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descripción</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Monto Default</TableHead>
            <TableHead className="text-center">Activo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} className={!expense.is_active ? "opacity-50" : ""}>
              <TableCell className="font-medium">{expense.description}</TableCell>
              <TableCell>
                <Badge variant="outline">{expense.category}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {expense.currency} {expense.default_amount.toLocaleString()}
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={expense.is_active}
                  onCheckedChange={() => handleToggleActive(expense)}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleGenerateClick(expense)}
                    disabled={!expense.is_active}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClick(expense)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <GenerateRecurringDialog
        expense={selectedExpense}
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerate={onGenerate}
      />

      <EditRecurringExpenseDialog
        expense={selectedExpense}
        categories={categories}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdate={onUpdate}
      />
    </>
  );
}
