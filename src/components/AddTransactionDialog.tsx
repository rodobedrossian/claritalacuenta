import { useState } from "react";
import { Plus, CalendarIcon, Wallet } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  }) => void;
  categories: Array<{ id: string; name: string; type: string }>;
  users: Array<{ id: string; full_name: string | null }>;
  currentSavings?: { usd: number; ars: number };
}

export const AddTransactionDialog = ({ onAdd, categories, users, currentSavings }: AddTransactionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [currency, setCurrency] = useState<"USD" | "ARS" | "">("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [fromSavings, setFromSavings] = useState(false);
  const [savingsSource, setSavingsSource] = useState<"cash" | "bank" | "other" | "">("");

  const availableSavings = currency && currentSavings 
    ? (currency === "USD" ? currentSavings.usd : currentSavings.ars) 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !currency || !category || !description || !userId) {
      toast.error("Completa todos los campos");
      return;
    }

    if (fromSavings && !savingsSource) {
      toast.error("Selecciona el tipo de ahorro");
      return;
    }

    const amountNum = parseFloat(amount);
    if (fromSavings && amountNum > availableSavings) {
      toast.error(`No tienes suficientes ahorros. Disponible: ${currency} ${availableSavings.toLocaleString()}`);
      return;
    }

    onAdd({
      type,
      amount: amountNum,
      currency: currency as "USD" | "ARS",
      category,
      description,
      date: date.toISOString(),
      user_id: userId,
      from_savings: fromSavings,
      savings_source: fromSavings ? savingsSource : undefined,
    });

    setOpen(false);
    setCurrency("");
    setAmount("");
    setCategory("");
    setDescription("");
    setUserId("");
    setDate(new Date());
    setFromSavings(false);
    setSavingsSource("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary hover:opacity-90 transition-smooth shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Add a new income or expense to track your finances.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value: "income" | "expense") => setType(value)}>
              <SelectTrigger id="type" className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={(value: "USD" | "ARS") => setCurrency(value)}>
              <SelectTrigger id="currency" className="bg-muted border-border">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="ARS">ARS ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
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
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="bg-muted border-border">
                <SelectValue placeholder="Select category" />
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
            <Label htmlFor="owner">Owner</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger id="owner" className="bg-muted border-border">
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || "Unknown User"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
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
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
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

          {/* From Savings Option - only for expenses */}
          {type === "expense" && currency && (
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
