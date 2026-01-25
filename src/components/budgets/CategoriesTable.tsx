import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Category } from "@/hooks/useCategoriesData";

interface CategoriesTableProps {
  categories: Category[];
}

export const CategoriesTable = ({ categories }: CategoriesTableProps) => {
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
            <TableHead className="text-right">Tipo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell className="text-right">
                <Badge variant={category.type === "expense" ? "destructive" : "default"}>
                  {category.type === "expense" ? "Gasto" : "Ingreso"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  return (
    <div className="space-y-6">
      {expenseCategories.length > 0 && renderTable(expenseCategories, "Categorías de Gastos")}
      {incomeCategories.length > 0 && renderTable(incomeCategories, "Categorías de Ingresos")}
    </div>
  );
};
