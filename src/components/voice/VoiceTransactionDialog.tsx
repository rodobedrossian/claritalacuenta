import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Mic, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VoiceTransactionData } from "@/hooks/useVoiceTransaction";

interface VoiceTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: VoiceTransactionData | null;
  transcribedText: string;
  categories: Array<{ name: string; type: string }>;
  users: Array<{ id: string; name: string }>;
  onConfirm: (transaction: {
    type: "income" | "expense";
    amount: number;
    currency: "USD" | "ARS";
    category: string;
    description: string;
    date: string;
    owner_id?: string;
  }) => void;
  onCancel: () => void;
}

export const VoiceTransactionDialog = ({
  open,
  onOpenChange,
  transaction,
  transcribedText,
  categories,
  users,
  onConfirm,
  onCancel,
}: VoiceTransactionDialogProps) => {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "ARS">("ARS");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [ownerId, setOwnerId] = useState<string>("");

  // Update form when transaction changes
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setCurrency(transaction.currency);
      setCategory(transaction.category);
      setDescription(transaction.description);
      setDate(parseISO(transaction.date));
      
      // Find owner ID by name
      if (transaction.owner) {
        const owner = users.find(u => 
          u.name.toLowerCase() === transaction.owner?.toLowerCase()
        );
        if (owner) {
          setOwnerId(owner.id);
        }
      }
    }
  }, [transaction, users]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    onConfirm({
      type,
      amount: numAmount,
      currency,
      category,
      description,
      date: format(date, "yyyy-MM-dd"),
      owner_id: ownerId || undefined,
    });
  };

  const filteredCategories = categories.filter(c => c.type === type);
  const confidenceColor = transaction?.confidence && transaction.confidence >= 0.8 
    ? "bg-green-500/20 text-green-600" 
    : transaction?.confidence && transaction.confidence >= 0.5 
      ? "bg-yellow-500/20 text-yellow-600"
      : "bg-red-500/20 text-red-600";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Confirmar Transacción
          </DialogTitle>
          <DialogDescription>
            Revisa y edita los datos extraídos de tu grabación
          </DialogDescription>
        </DialogHeader>

        {/* Transcribed text */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <p className="text-muted-foreground mb-1">Texto reconocido:</p>
          <p className="italic">"{transcribedText}"</p>
          {transaction?.confidence !== undefined && (
            <Badge className={cn("mt-2", confidenceColor)}>
              {transaction.confidence >= 0.8 ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              Confianza: {Math.round(transaction.confidence * 100)}%
            </Badge>
          )}
        </div>

        <div className="grid gap-4 py-4">
          {/* Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Gasto</SelectItem>
                <SelectItem value="income">Ingreso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Monto</Label>
            <div className="col-span-3 flex gap-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
                placeholder="0"
              />
              <Select value={currency} onValueChange={(v) => setCurrency(v as "USD" | "ARS")}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Descripción</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Descripción..."
            />
          </div>

          {/* Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Owner */}
          {users.length > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Usuario</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* AI Notes */}
          {transaction?.notes && (
            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              💡 {transaction.notes}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!amount || !category || parseFloat(amount) <= 0}
            className="gradient-primary"
          >
            Guardar Transacción
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
