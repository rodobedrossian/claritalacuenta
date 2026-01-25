import { useState } from "react";
import { Plus } from "lucide-react";
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
import { toast } from "sonner";

interface AddCreditCardDialogProps {
  onAdd: (card: { name: string; bank: string | null; closing_day: number | null }) => Promise<void>;
}

export const AddCreditCardDialog = ({ onAdd }: AddCreditCardDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [closingDay, setClosingDay] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Ingresa un nombre para la tarjeta");
      return;
    }

    try {
      await onAdd({
        name: name.trim(),
        bank: bank.trim() || null,
        closing_day: closingDay ? parseInt(closingDay) : null
      });
      
      setOpen(false);
      setName("");
      setBank("");
      setClosingDay("");
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Tarjeta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Agregar Tarjeta de Crédito</DialogTitle>
          <DialogDescription>
            Registra una nueva tarjeta para seguimiento de gastos
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la tarjeta *</Label>
            <Input
              id="name"
              placeholder="Ej: VISA Oro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank">Banco (opcional)</Label>
            <Input
              id="bank"
              placeholder="Ej: Galicia"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="bg-muted border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closingDay">Día de cierre (opcional)</Label>
            <Input
              id="closingDay"
              type="number"
              min="1"
              max="31"
              placeholder="1-31"
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              className="bg-muted border-border"
            />
          </div>

          <Button type="submit" className="w-full gradient-primary hover:opacity-90">
            Agregar Tarjeta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
