import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { GoalAmountStep } from "./GoalAmountStep";
import { GoalDetailsStep } from "./GoalDetailsStep";
import { SavingsGoal } from "@/hooks/useSavingsData";
import { toast } from "sonner";
import { format } from "date-fns";

type WizardStep = "amount" | "details";

interface AddGoalWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (goal: Omit<SavingsGoal, "id" | "user_id" | "created_at" | "updated_at" | "is_completed">) => Promise<void>;
}

export const AddGoalWizard = ({ 
  open, 
  onOpenChange, 
  onAdd 
}: AddGoalWizardProps) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<WizardStep>("amount");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [currency, setCurrency] = useState<"USD" | "ARS" | "">("");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [targetDate, setTargetDate] = useState<Date | undefined>();

  const resetForm = () => {
    setStep("amount");
    setCurrency("");
    setAmount("");
    setName("");
    setTargetDate(undefined);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleNextStep = () => {
    if (!currency || parseFloat(amount) <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    setStep("details");
  };

  const handleBackStep = () => {
    setStep("amount");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Ingresa un nombre para el objetivo");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        target_amount: numAmount,
        currency: currency as "USD" | "ARS",
        target_date: targetDate ? format(targetDate, "yyyy-MM-dd") : null,
      });

      handleOpenChange(false);
    } catch (error) {
      console.error("Error adding goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
      {step === "amount" && (
        <GoalAmountStep
          currency={currency}
          amount={amount}
          onCurrencyChange={setCurrency}
          onAmountChange={setAmount}
          onNext={handleNextStep}
        />
      )}
      {step === "details" && currency && (
        <GoalDetailsStep
          currency={currency as "USD" | "ARS"}
          amount={amount}
          name={name}
          targetDate={targetDate}
          onNameChange={setName}
          onTargetDateChange={setTargetDate}
          onBack={handleBackStep}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="h-[85vh] max-h-[85vh]">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] min-h-[520px] h-auto p-0 overflow-hidden flex flex-col">
        {content}
      </DialogContent>
    </Dialog>
  );
};
