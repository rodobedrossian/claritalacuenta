import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { InvestmentTypeStep, InvestmentType } from "./InvestmentTypeStep";
import { InvestmentAmountStep } from "./InvestmentAmountStep";
import { InvestmentDetailsStep } from "./InvestmentDetailsStep";
import { Investment } from "@/hooks/useSavingsData";
import { toast } from "sonner";
import { format } from "date-fns";

type WizardStep = "type" | "amount" | "details";

interface AddInvestmentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (investment: Omit<Investment, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
}

export const AddInvestmentWizard = ({ 
  open, 
  onOpenChange, 
  onAdd 
}: AddInvestmentWizardProps) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<WizardStep>("type");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [investmentType, setInvestmentType] = useState<InvestmentType | "">("");
  const [currency, setCurrency] = useState<"USD" | "ARS" | "">("");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [rateType, setRateType] = useState<"fixed" | "variable" | "none">("none");
  const [interestRate, setInterestRate] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setStep("type");
    setInvestmentType("");
    setCurrency("");
    setAmount("");
    setName("");
    setInstitution("");
    setRateType("none");
    setInterestRate("");
    setStartDate(new Date());
    setEndDate(undefined);
    setNotes("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleTypeNext = () => {
    if (!investmentType) {
      toast.error("Selecciona un tipo de inversión");
      return;
    }
    setStep("amount");
  };

  const handleAmountNext = () => {
    if (!currency || parseFloat(amount) <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    setStep("details");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Ingresa un nombre para la inversión");
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
        investment_type: investmentType as InvestmentType,
        currency: currency as "USD" | "ARS",
        principal_amount: numAmount,
        current_amount: numAmount,
        interest_rate: rateType === "fixed" ? (parseFloat(interestRate) || null) : null,
        rate_type: rateType,
        institution: institution.trim() || null,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        is_active: true,
        notes: notes.trim() || null,
      });

      handleOpenChange(false);
    } catch (error) {
      console.error("Error adding investment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div className="h-full flex flex-col">
      {step === "type" && (
        <InvestmentTypeStep
          selectedType={investmentType}
          onTypeChange={setInvestmentType}
          onNext={handleTypeNext}
        />
      )}
      {step === "amount" && investmentType && (
        <InvestmentAmountStep
          investmentType={investmentType}
          currency={currency}
          amount={amount}
          onCurrencyChange={setCurrency}
          onAmountChange={setAmount}
          onBack={() => setStep("type")}
          onNext={handleAmountNext}
        />
      )}
      {step === "details" && investmentType && currency && (
        <InvestmentDetailsStep
          investmentType={investmentType}
          currency={currency as "USD" | "ARS"}
          amount={amount}
          name={name}
          institution={institution}
          rateType={rateType}
          interestRate={interestRate}
          startDate={startDate}
          endDate={endDate}
          notes={notes}
          onNameChange={setName}
          onInstitutionChange={setInstitution}
          onRateTypeChange={setRateType}
          onInterestRateChange={setInterestRate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onNotesChange={setNotes}
          onBack={() => setStep("amount")}
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
      <DialogContent className="max-w-md h-[650px] p-0 overflow-hidden">
        {content}
      </DialogContent>
    </Dialog>
  );
};
