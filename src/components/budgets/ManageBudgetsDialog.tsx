import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BudgetsList } from "./BudgetsList";
import { AddBudgetWizard } from "./AddBudgetWizard";
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
  const [addWizardOpen, setAddWizardOpen] = useState(false);
  const existingBudgets = budgets.map((b) => ({
    category: b.category,
    currency: b.currency,
  }));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Gestionar Presupuestos</DialogTitle>
              <Button size="sm" onClick={() => setAddWizardOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Nuevo
              </Button>
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

      <AddBudgetWizard
        onAdd={onAdd}
        categories={categories}
        existingBudgets={existingBudgets}
        open={addWizardOpen}
        onOpenChange={setAddWizardOpen}
      />
    </>
  );
};
