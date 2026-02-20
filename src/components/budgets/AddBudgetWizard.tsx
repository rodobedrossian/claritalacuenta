import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { BudgetCategoryStep } from "./BudgetCategoryStep";
import { BudgetLimitStep } from "./BudgetLimitStep";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
  color?: string | null;
}

interface AddBudgetWizardProps {
  onAdd: (budget: {
    category: string;
    monthly_limit: number;
    currency: string;
  }) => Promise<void>;
  categories: Category[];
  existingBudgets: Array<{ category: string; currency: string }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type WizardStep = "category" | "limit";

export const AddBudgetWizard = ({
  onAdd,
  categories,
  existingBudgets,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddBudgetWizardProps) => {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const [step, setStep] = useState<WizardStep>("category");
  const [currency, setCurrency] = useState<"USD" | "ARS" | "">("");
  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categorías que tienen al menos una moneda sin presupuesto (ARS o USD)
  const availableCategories = useMemo(
    () =>
      categories
        .filter((c) => c.type === "expense")
        .filter((c) => {
          const hasARS = existingBudgets.some((b) => b.category === c.name && b.currency === "ARS");
          const hasUSD = existingBudgets.some((b) => b.category === c.name && b.currency === "USD");
          return !hasARS || !hasUSD;
        }),
    [categories, existingBudgets]
  );

  // Para la categoría elegida, monedas que aún no tienen presupuesto
  const availableCurrencies = useMemo((): ("USD" | "ARS")[] => {
    if (!category) return [];
    const hasARS = existingBudgets.some((b) => b.category === category && b.currency === "ARS");
    const hasUSD = existingBudgets.some((b) => b.category === category && b.currency === "USD");
    const out: ("USD" | "ARS")[] = [];
    if (!hasARS) out.push("ARS");
    if (!hasUSD) out.push("USD");
    return out;
  }, [category, existingBudgets]);

  const resetForm = () => {
    setStep("category");
    setCurrency("");
    setCategory("");
    setMonthlyLimit("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm();
    setOpen(newOpen);
  };

  const handleSubmit = async () => {
    if (!currency) {
      toast.error("Elegí una moneda");
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
        currency,
      });
      handleOpenChange(false);
    } catch (err) {
      console.error("Add budget error:", err);
      toast.error("No se pudo crear el presupuesto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 mb-4 shrink-0">
        {([0, 1] as const).map((i) => {
          const stepIndex = step === "limit" ? 1 : 0;
          return (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          );
        })}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {step === "category" && (
          <BudgetCategoryStep
            category={category}
            availableCategories={availableCategories}
            onCategoryChange={setCategory}
            onNext={() => {
              const cur = availableCurrencies;
              if (cur.length === 1) setCurrency(cur[0]);
              else if (cur.length === 2 && !currency) setCurrency(cur[0]);
              setStep("limit");
            }}
          />
        )}

        {step === "limit" && category && (
          <BudgetLimitStep
            currency={currency}
            availableCurrencies={availableCurrencies}
            onCurrencyChange={setCurrency}
            categoryName={category}
            monthlyLimit={monthlyLimit}
            onMonthlyLimitChange={setMonthlyLimit}
            onBack={() => {
              setCurrency("");
              setStep("category");
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="h-[85vh] max-h-[85vh] px-4 pb-safe">
          <div className="pt-4 h-full flex flex-col">
            <h2 className="text-lg font-semibold text-center mb-1">Crear Presupuesto</h2>
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md h-[85vh] max-h-[85vh] min-h-[400px] p-0 overflow-hidden flex flex-col">
        <div className="p-4 pb-0 shrink-0">
          <h2 className="text-lg font-semibold text-center">Crear Presupuesto</h2>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden px-4 pb-4 flex flex-col">{content}</div>
      </DialogContent>
    </Dialog>
  );
};
