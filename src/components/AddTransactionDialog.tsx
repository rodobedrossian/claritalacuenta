import { useState } from "react";
import { CalendarIcon, Wallet, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreditCardOption {
  id: string;
  name: string;
  bank: string | null;
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
    is_projected?: boolean;
    credit_card_id?: string;
  }) => void;
  categories: Array<{ id: string; name: string; type: string }>;
  currentUserId: string;
  currentSavings?: { usd: number; ars: number };
  creditCards?: CreditCardOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AddTransactionDialog = ({ 
  onAdd, 
  categories, 
  currentUserId,
  currentSavings, 
  creditCards = [],
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: AddTransactionDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;
  const [type, setType] = useState<"income" | "expense">("expense");
  const [currency, setCurrency] = useState<"USD" | "ARS" | "">("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [fromSavings, setFromSavings] = useState(false);
  const [savingsSource, setSavingsSource] = useState<"cash" | "bank" | "other" | "">("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "debit" | "credit_card">("cash");
  const [creditCardId, setCreditCardId] = useState("");

  const availableSavings = currency && currentSavings 
    ? (currency === "USD" ? currentSavings.usd : currentSavings.ars) 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !currency || !category || !description) {
      toast.error("Completa todos los campos");
      return;
    }

    if (fromSavings && !savingsSource) {
      toast.error("Selecciona el tipo de ahorro");
      return;
    }

    if (paymentMethod === "credit_card" && !creditCardId && creditCards.length > 0) {
      toast.error("Selecciona una tarjeta de crédito");
      return;
    }

    const amountNum = parseFloat(amount);
    if (fromSavings && amountNum > availableSavings) {
      toast.error(`No tienes suficientes ahorros. Disponible: ${currency} ${availableSavings.toLocaleString()}`);
      return;
    }

    // Credit card expenses are projected (don't impact balance until reconciled)
    const isProjected = paymentMethod === "credit_card";

    onAdd({
      type,
      amount: amountNum,
      currency: currency as "USD" | "ARS",
      category,
      description,
      date: date.toISOString(),
      user_id: currentUserId,
      from_savings: fromSavings,
      savings_source: fromSavings ? savingsSource : undefined,
      payment_method: paymentMethod,
      is_projected: isProjected,
      credit_card_id: paymentMethod === "credit_card" ? creditCardId : undefined,
    });

    setOpen(false);
    setCurrency("");
    setAmount("");
    setCategory("");
    setDescription("");
    setDate(new Date());
    setFromSavings(false);
    setSavingsSource("");
    setPaymentMethod("cash");
    setCreditCardId("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Transacción</DialogTitle>
          <DialogDescription>
            Agregá un nuevo ingreso o gasto para llevar el control de tus finanzas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={(value: "income" | "expense") => {
              setType(value);
              // Reset payment method for income
              if (value === "income") {
                setPaymentMethod("cash");
                setFromSavings(false);
              }
            }}>
              <SelectTrigger id="type" className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="income">Ingreso</SelectItem>
                <SelectItem value="expense">Gasto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select value={currency} onValueChange={(value: "USD" | "ARS") => setCurrency(value)}>
              <SelectTrigger id="currency" className="bg-muted border-border">
                <SelectValue placeholder="Seleccionar moneda" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="ARS">ARS ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-muted border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="bg-muted border-border">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-muted border-border",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              placeholder="¿Para qué fue?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted border-border"
            />
          </div>

          {/* Payment Method - only for expenses */}
          {type === "expense" && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Método de pago
                </Label>
                <Select 
                  value={paymentMethod} 
                  onValueChange={(value: "cash" | "debit" | "credit_card") => {
                    setPaymentMethod(value);
                    // Clear from savings if using credit card
                    if (value === "credit_card") {
                      setFromSavings(false);
                      setSavingsSource("");
                    }
                  }}
                >
                  <SelectTrigger id="paymentMethod" className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="debit">Débito</SelectItem>
                    <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Credit Card Selector */}
              {paymentMethod === "credit_card" && creditCards.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="creditCard">Tarjeta</Label>
                  <Select value={creditCardId} onValueChange={setCreditCardId}>
                    <SelectTrigger id="creditCard" className="bg-muted border-border">
                      <SelectValue placeholder="Seleccionar tarjeta" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {creditCards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name} {card.bank && `(${card.bank})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Este gasto se registrará como proyectado y no impactará tu balance hasta que pagues el resumen
                  </p>
                </div>
              )}

              {paymentMethod === "credit_card" && creditCards.length === 0 && (
                <p className="text-xs text-warning">
                  No tienes tarjetas registradas. Agrega una en Configuración → Tarjetas de Crédito
                </p>
              )}
            </div>
          )}

          {/* From Savings Option - only for expenses NOT paid with credit card */}
          {type === "expense" && currency && paymentMethod !== "credit_card" && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fromSavings"
                  checked={fromSavings}
                  onChange={(e) => {
                    setFromSavings(e.target.checked);
                    if (!e.target.checked) setSavingsSource("");
                  }}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="fromSavings" className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="h-4 w-4" />
                  Sale de mis ahorros
                </Label>
              </div>
              
              {fromSavings && (
                <>
                  <div className="text-xs text-muted-foreground">
                    Disponible: {currency} {availableSavings.toLocaleString()}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="savingsSource">Tipo de ahorro</Label>
                    <Select value={savingsSource} onValueChange={(value: "cash" | "bank" | "other") => setSavingsSource(value)}>
                      <SelectTrigger id="savingsSource" className="bg-muted border-border">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="bank">Banco</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}

          <Button type="submit" className="w-full gradient-primary hover:opacity-90">
            Agregar Transacción
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};