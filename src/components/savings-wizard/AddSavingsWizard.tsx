import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { SavingsAmountStep } from "./SavingsAmountStep";
import { SavingsDetailsStep } from "./SavingsDetailsStep";
import { SavingsEntry } from "@/hooks/useSavingsData";
import { toast } from "sonner";

type WizardStep = "amount" | "details";

interface AddSavingsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (entry: Omit<SavingsEntry, "id" | "user_id" | "created_at">) => Promise<void>;
}

export const AddSavingsWizard = ({
  open,
  onOpenChange,
  onAdd,
}: AddSavingsWizardProps) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<WizardStep>("amount");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [entryType, setEntryType] = useState<"deposit" | "withdrawal" | "interest">("deposit");
  const [currency, setCurrency] = useState<"USD" | "ARS" | "">("");
  const [amount, setAmount] = useState("");
  const [savingsType, setSavingsType] = useState<"cash" | "bank" | "other" | "">("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setStep("amount");
    setEntryType("deposit");
    setCurrency("");
    setAmount("");
    setSavingsType("");
    setNotes("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleNextStep = () => {
    if (step === "amount") {
      setStep("details");
    }
  };

  const handleBackStep = () => {
    if (step === "details") {
      setStep("amount");
    }
  };

  const handleSubmit = async () => {
    if (!currency || !savingsType) {
      toast.error("Completa todos los campos requeridos");
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
        entry_type: entryType,
        currency: currency as "USD" | "ARS",
        amount: numAmount,
        savings_type: savingsType as "cash" | "bank" | "other",
        notes: notes.trim() || null,
      });
      handleOpenChange(false);
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error("Error al guardar el movimiento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <>
      {step === "amount" && (
        <SavingsAmountStep
          entryType={entryType}
          currency={currency}
          amount={amount}
          onEntryTypeChange={setEntryType}
          onCurrencyChange={setCurrency}
          onAmountChange={setAmount}
          onNext={handleNextStep}
        />
      )}
      {step === "details" && currency && (
        <SavingsDetailsStep
          entryType={entryType}
          currency={currency as "USD" | "ARS"}
          amount={amount}
          savingsType={savingsType}
          notes={notes}
          onSavingsTypeChange={setSavingsType}
          onNotesChange={setNotes}
          onBack={handleBackStep}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="h-[85vh] px-4 pb-safe">
          <div className="pt-4 h-full">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6 h-[600px] flex flex-col">
        {content}
      </DialogContent>
    </Dialog>
  );
};
