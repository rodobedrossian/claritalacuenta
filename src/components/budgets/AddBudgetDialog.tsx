import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from
"@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface AddBudgetDialogProps {
  onAdd: (budget: {
    category: string;
    monthly_limit: number;
    currency: string;
  }) => Promise<void>;
  categories: Category[];
  existingBudgets: Array<{category: string;currency: string;}>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AddBudgetDialog = ({
  onAdd,
  categories,
  existingBudgets,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: AddBudgetDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [category, setCategory] = useState("");
  const [currency, setCurrency] = useState<"USD" | "ARS">("ARS");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter categories to only show expense categories that don't have a budget yet
  const availableCategories = categories.
  filter((c) => c.type === "expense").
  filter(
    (c) =>
    !existingBudgets.some(
      (b) => b.category === c.name && b.currency === currency
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !monthlyLimit) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    const limit = parseFloat(monthlyLimit);
    if (isNaN(limit) || limit <= 0) {
      toast.error("El límite debe ser un número mayor a 0");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        category,
        monthly_limit: limit,
        currency
      });
      setOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCategory("");
    setCurrency("ARS");
    setMonthlyLimit("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlledOpen &&
      <DialogTrigger asChild>
          



        </DialogTrigger>
      }
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Presupuesto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select
                value={currency}
                onValueChange={(v) => {
                  setCurrency(v as "USD" | "ARS");
                  setCategory(""); // Reset category when currency changes
                }}>

                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Límite Mensual</Label>
              <Input
                type="number"
                placeholder="0"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                min="0"
                step="0.01" />

            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.length === 0 ?
                <div className="p-2 text-sm text-muted-foreground text-center">
                    No hay categorías disponibles para esta moneda
                  </div> :

                availableCategories.map((cat) =>
                <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                )
                }
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary"
            disabled={isSubmitting || !category || !monthlyLimit}>

            {isSubmitting ? "Creando..." : "Crear Presupuesto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>);

};