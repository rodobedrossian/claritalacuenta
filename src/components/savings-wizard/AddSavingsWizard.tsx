import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { SavingsAmountStep, SavingsSource } from "./SavingsAmountStep";
import { SavingsDetailsStep } from "./SavingsDetailsStep";
import { SavingsEntry } from "@/hooks/useSavingsData";
import { toast } from "sonner";

type WizardStep = "amount" | "details";

interface AddSavingsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (entry: Omit<SavingsEntry, "id" | "user_id" | "created_at">) => Promise<void>;
  availableBalanceUSD?: number;
  availableBalanceARS?: number;
}

export const AddSavingsWizard = ({ 
  open, 
  onOpenChange, 
  onAdd,
  availableBalanceUSD = 0,
  availableBalanceARS = 0
}: AddSavingsWizardProps) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<WizardStep>("amount");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [source, setSource] = useState<SavingsSource>(
    availableBalanceUSD > 0 || availableBalanceARS > 0 ? "balance" : "previous"
  );
  const [currency, setCurrency] = useState<"USD" | "ARS" | "">("");
  const [amount, setAmount] = useState("");
  const [savingsType, setSavingsType] = useState<"cash" | "bank" | "other" | "">("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setStep("amount");
    setSource(availableBalanceUSD > 0 || availableBalanceARS > 0 ? "balance" : "previous");
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
      // Build notes with source info
      let finalNotes = notes.trim();
      if (source === "balance") {
        const autoNote = "Transferencia desde balance del mes";
        finalNotes = finalNotes ? `${autoNote} - ${finalNotes}` : autoNote;
      }

      await onAdd({
        entry_type: "deposit", // Always deposit for savings registration
        currency: currency as "USD" | "ARS",
        amount: numAmount,
        notes: finalNotes || null,
        savings_type: savingsType as "cash" | "bank" | "other",
      });

      handleOpenChange(false);
    } catch (error) {
      console.error("Error adding savings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
      {step === "amount" && (
        <SavingsAmountStep
          source={source}
          currency={currency}
          amount={amount}
          availableBalanceUSD={availableBalanceUSD}
          availableBalanceARS={availableBalanceARS}
          onSourceChange={setSource}
          onCurrencyChange={setCurrency}
          onAmountChange={setAmount}
          onNext={handleNextStep}
        />
      )}
      {step === "details" && currency && (
        <SavingsDetailsStep
          source={source}
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
