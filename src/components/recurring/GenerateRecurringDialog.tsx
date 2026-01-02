import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecurringExpense } from "@/hooks/useRecurringExpensesData";

interface GenerateRecurringDialogProps {
  expense: RecurringExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (expense: RecurringExpense, amount?: number) => Promise<void>;
}

export function GenerateRecurringDialog({
  expense,
  open,
  onOpenChange,
  onGenerate,
}: GenerateRecurringDialogProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && expense) {
      setAmount(expense.default_amount.toString());
    }
    onOpenChange(isOpen);
  };

  const handleGenerate = async () => {
    if (!expense) return;

    setLoading(true);
    try {
      const finalAmount = amount ? parseFloat(amount) : expense.default_amount;
      await onGenerate(expense, finalAmount);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Gasto</DialogTitle>
          <DialogDescription>
            {expense.description} - Categoría: {expense.category}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="generate-amount">
              Monto ({expense.currency})
            </Label>
            <Input
              id="generate-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={expense.default_amount.toString()}
              step="0.01"
              min="0"
            />
            <p className="text-sm text-muted-foreground">
              Monto por defecto: {expense.currency} {expense.default_amount.toLocaleString()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? "Registrando..." : "Registrar Gasto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
