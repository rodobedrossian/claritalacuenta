import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Category } from "@/hooks/useCategoriesData";

interface CategoriesTableProps {
  categories: Category[];
  onUpdate: (id: string, category: Partial<Category>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const CategoriesTable = ({ categories, onUpdate, onDelete }: CategoriesTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditType(category.type);
  };

  const handleSave = async (id: string) => {
    if (editName.trim()) {
      await onUpdate(id, { name: editName.trim(), type: editType });
    }
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
    setEditType("expense");
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  if (categories.length === 0) {
    return (
      <Card className="p-8 gradient-card border-border/50">
        <p className="text-center text-muted-foreground">
          No hay categorías. Crea una para empezar a organizar tus finanzas.
        </p>
      </Card>
    );
  }

  const renderTable = (items: Category[], title: string) => (
    <Card className="gradient-card border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-medium">{title}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">
                {editingId === category.id ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-48"
                    autoFocus
                  />
                ) : (
                  category.name
                )}
              </TableCell>
              <TableCell>
                {editingId === category.id ? (
                  <Select value={editType} onValueChange={(v) => setEditType(v as "income" | "expense")}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Gasto</SelectItem>
                      <SelectItem value="income">Ingreso</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={category.type === "expense" ? "destructive" : "default"}>
                    {category.type === "expense" ? "Gasto" : "Ingreso"}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {editingId === category.id ? (
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleSave(category.id)}
                    >
                      <Check className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteId(category.id)}
                    >
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
  );

  return (
    <>
      <div className="space-y-6">
        {expenseCategories.length > 0 && renderTable(expenseCategories, "Categorías de Gastos")}
        {incomeCategories.length > 0 && renderTable(incomeCategories, "Categorías de Ingresos")}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Solo se puede eliminar si no tiene transacciones o presupuestos asociados.
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
    </>
  );
};
