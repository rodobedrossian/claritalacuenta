import { useState } from "react";
import { ArrowRight, PiggyBank, Plus, Wallet, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface SavingsActionDropdownProps {
  availableBalanceUSD: number;
  availableBalanceARS: number;
  onTransferFromBalance: (
    currency: "USD" | "ARS",
    amount: number,
    savingsType: "cash" | "bank" | "other",
    notes?: string
  ) => void;
  onAddSavings: (
    currency: "USD" | "ARS",
    amount: number,
    entryType: "deposit" | "withdrawal",
    savingsType: "cash" | "bank" | "other",
    notes?: string
  ) => void;
}

type ActionMode = "transfer" | "manual" | null;

export const SavingsActionDropdown = ({
  availableBalanceUSD,
  availableBalanceARS,
  onTransferFromBalance,
  onAddSavings,
}: SavingsActionDropdownProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  
  // Form state
  const [currency, setCurrency] = useState<"USD" | "ARS" | "">("");
  const [amount, setAmount] = useState("");
  const [savingsType, setSavingsType] = useState<"cash" | "bank" | "other" | "">("");
  const [entryType, setEntryType] = useState<"deposit" | "withdrawal">("deposit");
  const [notes, setNotes] = useState("");

  const availableBalance = currency === "USD" ? availableBalanceUSD : currency === "ARS" ? availableBalanceARS : 0;
  const hasPositiveBalance = availableBalanceUSD > 0 || availableBalanceARS > 0;

  const resetForm = () => {
    setCurrency("");
    setAmount("");
    setSavingsType("");
    setEntryType("deposit");
    setNotes("");
  };

  const handleOpenAction = (mode: ActionMode) => {
    setActionMode(mode);
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currency || !amount || !savingsType) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    if (actionMode === "transfer") {
      if (amountNum > availableBalance) {
        toast.error(`El monto excede el balance disponible (${currency} ${availableBalance.toLocaleString()})`);
        return;
      }
      onTransferFromBalance(
        currency as "USD" | "ARS",
        amountNum,
        savingsType as "cash" | "bank" | "other",
        "Transferencia desde balance del mes"
      );
      toast.success("Transferencia a ahorros registrada");
    } else {
      onAddSavings(
        currency as "USD" | "ARS",
        amountNum,
        entryType,
        savingsType as "cash" | "bank" | "other",
        notes || undefined
      );
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleSetMaxAmount = () => {
    if (availableBalance > 0) {
      setAmount(availableBalance.toString());
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
            <PiggyBank className="mr-2 h-4 w-4" />
            Ahorrar
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem 
            onClick={() => handleOpenAction("transfer")}
            disabled={!hasPositiveBalance}
            className="flex flex-col items-start py-3 cursor-pointer"
          >
            <div className="flex items-center gap-2 font-medium">
              <Wallet className="h-4 w-4 text-primary" />
              Desde el balance del mes
            </div>
            <span className="text-xs text-muted-foreground mt-1 ml-6">
              {hasPositiveBalance 
                ? "Transferir dinero no gastado a ahorros" 
                : "Sin balance disponible este mes"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleOpenAction("manual")}
            className="flex flex-col items-start py-3 cursor-pointer"
          >
            <div className="flex items-center gap-2 font-medium">
              <Plus className="h-4 w-4 text-primary" />
              Registrar ahorro externo
            </div>
            <span className="text-xs text-muted-foreground mt-1 ml-6">
              Agregar un ahorro que ya tenías guardado
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" />
              {actionMode === "transfer" ? "Transferir a Ahorros" : "Registrar Ahorro"}
            </DialogTitle>
            <DialogDescription>
              {actionMode === "transfer" 
                ? "Transfiere parte de tu balance mensual a tus ahorros."
                : "Registra un ahorro que ya tenías guardado y no estaba en el sistema."}
            </DialogDescription>
          </DialogHeader>

          {actionMode === "transfer" && (
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
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {actionMode === "manual" && (
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
            )}

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
                  {actionMode === "transfer" ? (
                    <>
                      <SelectItem value="USD" disabled={availableBalanceUSD <= 0}>
                        USD ($) {availableBalanceUSD <= 0 && "- Sin saldo"}
                      </SelectItem>
                      <SelectItem value="ARS" disabled={availableBalanceARS <= 0}>
                        ARS ($) {availableBalanceARS <= 0 && "- Sin saldo"}
                      </SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="ARS">ARS ($)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Monto</Label>
                {actionMode === "transfer" && currency && availableBalance > 0 && (
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
                max={actionMode === "transfer" ? availableBalance : undefined}
              />
              {actionMode === "transfer" && currency && (
                <p className="text-xs text-muted-foreground">
                  Máximo: {currency} {availableBalance.toLocaleString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="savingsType">
                {actionMode === "transfer" ? "Destino del ahorro" : "Origen/Destino"}
              </Label>
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

            {actionMode === "manual" && (
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
            )}

            <Button type="submit" className="w-full gradient-primary hover:opacity-90">
              {actionMode === "transfer" ? (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Transferir a Ahorros
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Ahorro
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
