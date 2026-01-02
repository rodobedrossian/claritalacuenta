import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { SavingsGoal } from "@/hooks/useSavingsData";
import { toast } from "sonner";

interface AddGoalDialogProps {
  onAdd: (goal: Omit<SavingsGoal, "id" | "user_id" | "created_at" | "updated_at" | "is_completed">) => void;
}

export const AddGoalDialog = ({ onAdd }: AddGoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<"USD" | "ARS">("ARS");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    if (!name.trim()) {
      toast.error("Ingresa un nombre para el objetivo");
      return;
    }

    onAdd({
      name: name.trim(),
      currency,
      target_amount: amount,
      target_date: targetDate || null,
    });

    // Reset form
    setName("");
    setCurrency("ARS");
    setTargetAmount("");
    setTargetDate("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Objetivo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Objetivo de Ahorro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del Objetivo</Label>
            <Input
              placeholder="Ej: Viaje a Europa, Auto nuevo, Fondo de emergencia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Moneda</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as "USD" | "ARS")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">ARS (Pesos)</SelectItem>
                <SelectItem value="USD">USD (Dólares)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Monto Objetivo</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha Objetivo (opcional)</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Si defines una fecha, te mostraremos cuánto necesitas ahorrar por mes
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear Objetivo</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};