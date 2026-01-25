import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { SavingsEntry } from "@/hooks/useSavingsData";

interface EditSavingsEntryDialogProps {
  entry: SavingsEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, entry: Omit<SavingsEntry, "id" | "user_id" | "created_at">) => void;
  onDelete: (id: string) => void;
}

export const EditSavingsEntryDialog = ({
  entry,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: EditSavingsEntryDialogProps) => {
  const [currency, setCurrency] = useState<"USD" | "ARS">("USD");
  const [amount, setAmount] = useState("");
  const [entryType, setEntryType] = useState<"deposit" | "withdrawal" | "interest">("deposit");
  const [savingsType, setSavingsType] = useState<"cash" | "bank" | "other">("cash");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (entry) {
      setCurrency(entry.currency);
      setAmount(entry.amount.toString());
      setEntryType(entry.entry_type);
      setSavingsType(entry.savings_type || "cash");
      setNotes(entry.notes || "");
    }
  }, [entry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry || !amount) return;

    onUpdate(entry.id, {
      amount: parseFloat(amount),
      currency,
      entry_type: entryType,
      savings_type: savingsType,
      notes: notes || null,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!entry) return;
    onDelete(entry.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Editar Movimiento</DialogTitle>
          <DialogDescription>
            Modifica los detalles del movimiento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="entryType">Tipo de Movimiento</Label>
            <Select value={entryType} onValueChange={(value: "deposit" | "withdrawal" | "interest") => setEntryType(value)}>
              <SelectTrigger id="entryType" className="bg-muted border-border">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="deposit">Depósito</SelectItem>
                <SelectItem value="withdrawal">Retiro</SelectItem>
                <SelectItem value="interest">Interés</SelectItem>
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-muted border-border"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 gradient-primary hover:opacity-90">
              Guardar Cambios
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};