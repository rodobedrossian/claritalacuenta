import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BudgetsList } from "./BudgetsList";
import { AddBudgetDialog } from "./AddBudgetDialog";
import { Budget } from "@/hooks/useBudgetsData";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface ManageBudgetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgets: Budget[];
  categories: Category[];
  onAdd: (budget: {
    category: string;
    monthly_limit: number;
    currency: string;
  }) => Promise<void>;
  onUpdate: (id: string, budget: Partial<Budget>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ManageBudgetsDialog = ({
  open,
  onOpenChange,
  budgets,
  categories,
  onAdd,
  onUpdate,
  onDelete,
}: ManageBudgetsDialogProps) => {
  const existingBudgets = budgets.map((b) => ({
    category: b.category,
    currency: b.currency,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Gestionar Presupuestos</DialogTitle>
            <AddBudgetDialog
              onAdd={onAdd}
              categories={categories}
              existingBudgets={existingBudgets}
            />
          </div>
        </DialogHeader>
        <div className="mt-4">
          <BudgetsList
            budgets={budgets}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
