import { useState } from "react";
import { PiggyBank } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AddSavingsDialogProps {
  onAdd: (currency: "USD" | "ARS", amount: number, entryType: "deposit" | "withdrawal", savingsType: "cash" | "bank" | "other", notes?: string) => void;
}

export const AddSavingsDialog = ({ onAdd }: AddSavingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "ARS" | "">("");
  const [amount, setAmount] = useState("");
  const [entryType, setEntryType] = useState<"deposit" | "withdrawal" | "">("");
  const [savingsType, setSavingsType] = useState<"cash" | "bank" | "other" | "">("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !currency || !entryType || !savingsType) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    onAdd(
      currency as "USD" | "ARS", 
      parseFloat(amount), 
      entryType as "deposit" | "withdrawal",
      savingsType as "cash" | "bank" | "other",
      notes || undefined
    );

    setOpen(false);
    setCurrency("");
    setAmount("");
    setEntryType("");
    setSavingsType("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
          <PiggyBank className="mr-2 h-4 w-4" />
          Agregar Ahorro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Registrar Movimiento de Ahorro</DialogTitle>
          <DialogDescription>
            Registra un depósito o retiro de tus ahorros.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="entryType">Tipo de Movimiento</Label>
            <Select value={entryType} onValueChange={(value: "deposit" | "withdrawal") => setEntryType(value)}>
              <SelectTrigger id="entryType" className="bg-muted border-border">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="deposit">Depósito</SelectItem>
                <SelectItem value="withdrawal">Retiro</SelectItem>
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
            <Label htmlFor="savingsType">Origen/Destino</Label>
            <Select value={savingsType} onValueChange={(value: "cash" | "bank" | "other") => setSavingsType(value)}>
              <SelectTrigger id="savingsType" className="bg-muted border-border">
                <SelectValue placeholder="Seleccionar origen" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="bank">Banco</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agregar una nota..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-muted border-border"
            />
          </div>

          <Button type="submit" className="w-full gradient-primary hover:opacity-90">
            Guardar Movimiento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
