import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Trash2 } from "lucide-react";
import { Category } from "@/hooks/useCategoriesData";

interface CategoriesTableProps {
  categories: Category[];
  onDelete: (id: string) => Promise<void>;
}

export const CategoriesTable = ({ categories, onDelete }: CategoriesTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>
                <Badge variant={category.type === "expense" ? "destructive" : "default"}>
                  {category.type === "expense" ? "Gasto" : "Ingreso"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeleteId(category.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
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
