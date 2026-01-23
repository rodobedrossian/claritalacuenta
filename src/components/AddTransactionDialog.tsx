import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { AmountStep } from "./transaction-wizard/AmountStep";
import { CategoryStep } from "./transaction-wizard/CategoryStep";
import { DetailsStep } from "./transaction-wizard/DetailsStep";

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
  color?: string | null;
}

interface AddTransactionDialogProps {
  onAdd: (transaction: {
    type: "income" | "expense";
    amount: number;
    currency: "USD" | "ARS";
    category: string;
    description: string;
    date: string;
    user_id: string;
    from_savings?: boolean;
    savings_source?: string;
    payment_method?: string;
  }) => void;
  categories: Category[];
  currentUserId: string;
  currentSavings?: { usd: number; ars: number };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type WizardStep = "amount" | "category" | "details";

export const AddTransactionDialog = ({ 
  onAdd, 
  categories, 
  currentUserId,
  currentSavings, 
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: AddTransactionDialogProps) => {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;

  // Wizard state
  const [step, setStep] = useState<WizardStep>("amount");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [currency, setCurrency] = useState<"USD" | "ARS" | "">("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [fromSavings, setFromSavings] = useState(false);
  const [savingsSource, setSavingsSource] = useState<"cash" | "bank" | "other" | "">("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "debit">("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStep("amount");
      setType("expense");
      setCurrency("");
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(new Date());
      setFromSavings(false);
      setSavingsSource("");
      setPaymentMethod("cash");
    }
  }, [open]);

  const availableSavings = currency && currentSavings 
    ? (currency === "USD" ? currentSavings.usd : currentSavings.ars) 
    : 0;

  const handleTypeChange = (newType: "income" | "expense") => {
    setType(newType);
    if (newType === "income") {
      setPaymentMethod("cash");
      setFromSavings(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!amount || !currency || !category) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    // Use category name as description if empty
    const finalDescription = description.trim() || category;

    if (fromSavings && !savingsSource) {
      toast.error("Selecciona el tipo de ahorro");
      return;
    }

    const amountNum = parseFloat(amount);
    if (fromSavings && amountNum > availableSavings) {
      toast.error(`No tienes suficientes ahorros. Disponible: ${currency} ${availableSavings.toLocaleString()}`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onAdd({
        type,
        amount: amountNum,
        currency: currency as "USD" | "ARS",
        category,
        description: finalDescription,
        date: date.toISOString(),
        user_id: currentUserId,
        from_savings: fromSavings,
        savings_source: fromSavings ? savingsSource : undefined,
        payment_method: paymentMethod,
      });

      setOpen(false);
      toast.success("Transacción agregada");
    } catch (error) {
      toast.error("Error al agregar transacción");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress indicator
  const stepIndex = step === "amount" ? 0 : step === "category" ? 1 : 2;
  
  const content = (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <div className="flex gap-1 mb-4">
        {[0, 1, 2].map((i) => (
          <div 
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="flex-1 min-h-0">
        {step === "amount" && (
          <AmountStep
            type={type}
            currency={currency}
            amount={amount}
            onTypeChange={handleTypeChange}
            onCurrencyChange={setCurrency}
            onAmountChange={setAmount}
            onNext={() => setStep("category")}
          />
        )}

        {step === "category" && (
          <CategoryStep
            categories={categories}
            selectedCategory={category}
            onCategoryChange={setCategory}
            onNext={() => setStep("details")}
            onBack={() => setStep("amount")}
          />
        )}

        {step === "details" && currency && (
          <DetailsStep
            type={type}
            currency={currency}
            amount={amount}
            category={category}
            categories={categories}
            description={description}
            date={date}
            paymentMethod={paymentMethod}
            fromSavings={fromSavings}
            savingsSource={savingsSource}
            availableSavings={availableSavings}
            onDescriptionChange={setDescription}
            onDateChange={setDate}
            onPaymentMethodChange={setPaymentMethod}
            onFromSavingsChange={setFromSavings}
            onSavingsSourceChange={setSavingsSource}
            onBack={() => setStep("category")}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );

  // Use Drawer on mobile for better UX
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="h-[85vh] px-4 pb-safe">
          <div className="pt-4 h-full">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border h-[600px] flex flex-col p-4">
        {content}
      </DialogContent>
    </Dialog>
  );
};
