import { useState } from "react";
import { ArrowRight, PiggyBank } from "lucide-react";
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
import { toast } from "sonner";

interface TransferToSavingsDialogProps {
  availableBalanceUSD: number;
  availableBalanceARS: number;
  onTransfer: (
    currency: "USD" | "ARS",
    amount: number,
    savingsType: "cash" | "bank" | "other",
    notes?: string
  ) => void;
}

export const TransferToSavingsDialog = ({
  availableBalanceUSD,
  availableBalanceARS,
  onTransfer,
}: TransferToSavingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "ARS" | "">("");
  const [amount, setAmount] = useState("");
  const [savingsType, setSavingsType] = useState<"cash" | "bank" | "other" | "">("");

  const availableBalance = currency === "USD" ? availableBalanceUSD : currency === "ARS" ? availableBalanceARS : 0;
  const hasPositiveBalance = availableBalanceUSD > 0 || availableBalanceARS > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currency || !amount || !savingsType) {
      toast.error("Completa todos los campos");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    if (amountNum > availableBalance) {
      toast.error(`El monto excede el balance disponible (${currency} ${availableBalance.toLocaleString()})`);
      return;
    }

    onTransfer(
      currency as "USD" | "ARS",
      amountNum,
      savingsType as "cash" | "bank" | "other",
      `Transferencia desde balance del mes`
    );

    setOpen(false);
    setCurrency("");
    setAmount("");
    setSavingsType("");
    toast.success("Transferencia a ahorros registrada");
  };

  const handleSetMaxAmount = () => {
    if (availableBalance > 0) {
      setAmount(availableBalance.toString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-primary/50 hover:bg-primary/10"
          disabled={!hasPositiveBalance}
          title={!hasPositiveBalance ? "No hay balance positivo disponible" : "Transferir a ahorros"}
        >
          <PiggyBank className="mr-2 h-4 w-4" />
          Ahorrar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            Transferir a Ahorros
          </DialogTitle>
          <DialogDescription>
            Transfiere parte de tu balance mensual disponible a tus ahorros.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Disponible USD</p>
            <p className={`font-semibold ${availableBalanceUSD > 0 ? "text-success" : "text-muted-foreground"}`}>
              ${availableBalanceUSD.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Disponible ARS</p>
            <p className={`font-semibold ${availableBalanceARS > 0 ? "text-success" : "text-muted-foreground"}`}>
              ${availableBalanceARS.toLocaleString()}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select value={currency} onValueChange={(value: "USD" | "ARS") => {
              setCurrency(value);
              setAmount("");
            }}>
              <SelectTrigger id="currency" className="bg-muted border-border">
                <SelectValue placeholder="Seleccionar moneda" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="USD" disabled={availableBalanceUSD <= 0}>
                  USD ($) {availableBalanceUSD <= 0 && "- Sin saldo"}
                </SelectItem>
                <SelectItem value="ARS" disabled={availableBalanceARS <= 0}>
                  ARS ($) {availableBalanceARS <= 0 && "- Sin saldo"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Monto</Label>
              {currency && availableBalance > 0 && (
                <button
                  type="button"
                  onClick={handleSetMaxAmount}
                  className="text-xs text-primary hover:underline"
                >
                  Usar máximo
                </button>
              )}
            </div>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-muted border-border"
              max={availableBalance}
            />
            {currency && (
              <p className="text-xs text-muted-foreground">
                Máximo: {currency} {availableBalance.toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="savingsType">Destino del ahorro</Label>
            <Select value={savingsType} onValueChange={(value: "cash" | "bank" | "other") => setSavingsType(value)}>
              <SelectTrigger id="savingsType" className="bg-muted border-border">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="bank">Banco</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full gradient-primary hover:opacity-90">
            <ArrowRight className="mr-2 h-4 w-4" />
            Transferir a Ahorros
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
