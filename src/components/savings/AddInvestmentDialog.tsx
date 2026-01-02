import { useState, useMemo } from "react";
import { Plus, Calculator } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import { Investment } from "@/hooks/useSavingsData";
import { toast } from "sonner";

interface AddInvestmentDialogProps {
  onAdd: (investment: Omit<Investment, "id" | "user_id" | "created_at" | "updated_at">) => void;
}

const investmentTypes = [
  { value: "plazo_fijo", label: "Plazo Fijo" },
  { value: "fci", label: "FCI (Fondo Común de Inversión)" },
  { value: "cedear", label: "CEDEAR" },
  { value: "cripto", label: "Criptomonedas" },
  { value: "otro", label: "Otro" },
] as const;

export const AddInvestmentDialog = ({ onAdd }: AddInvestmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [investmentType, setInvestmentType] = useState<Investment["investment_type"]>("plazo_fijo");
  const [currency, setCurrency] = useState<"USD" | "ARS">("ARS");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [rateType, setRateType] = useState<Investment["rate_type"]>("fixed");
  const [interestRate, setInterestRate] = useState("");
  const [institution, setInstitution] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  // Calculate estimated return for fixed rate investments
  const estimatedReturn = useMemo(() => {
    if (rateType !== "fixed" || !interestRate || !endDate || !principalAmount) {
      return null;
    }

    const principal = parseFloat(principalAmount);
    const rate = parseFloat(interestRate);
    
    if (isNaN(principal) || isNaN(rate) || principal <= 0 || rate <= 0) {
      return null;
    }

    const days = differenceInDays(parseISO(endDate), parseISO(startDate));
    if (days <= 0) return null;

    const estimatedAmount = principal * (1 + (rate / 100) * (days / 365));
    const profit = estimatedAmount - principal;

    return { estimatedAmount, profit, days };
  }, [principalAmount, interestRate, startDate, endDate, rateType]);

  const formatCurrency = (amount: number, curr: "USD" | "ARS") => {
    return `${curr} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const principal = parseFloat(principalAmount);
    if (isNaN(principal) || principal <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    if (!name.trim()) {
      toast.error("Ingresa un nombre para la inversión");
      return;
    }

    const rate = rateType === "fixed" && interestRate ? parseFloat(interestRate) : null;

    onAdd({
      name: name.trim(),
      investment_type: investmentType,
      currency,
      principal_amount: principal,
      current_amount: principal,
      interest_rate: rate,
      rate_type: rateType,
      institution: institution.trim() || null,
      start_date: startDate,
      end_date: endDate || null,
      is_active: true,
      notes: notes.trim() || null,
    });

    // Reset form
    setName("");
    setInvestmentType("plazo_fijo");
    setCurrency("ARS");
    setPrincipalAmount("");
    setRateType("fixed");
    setInterestRate("");
    setInstitution("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setNotes("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Inversión
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Inversión</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              placeholder="Ej: Plazo Fijo Galicia Enero 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Inversión</Label>
              <Select 
                value={investmentType} 
                onValueChange={(v) => setInvestmentType(v as Investment["investment_type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {investmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

          <div className="space-y-2">
            <Label>Monto Invertido</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={principalAmount}
              onChange={(e) => setPrincipalAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Institución (opcional)</Label>
            <Input
              placeholder="Ej: Banco Galicia, Mercado Pago, Binance"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Tasa</Label>
            <Select value={rateType || "none"} onValueChange={(v) => setRateType(v as Investment["rate_type"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Tasa Fija (TNA)</SelectItem>
                <SelectItem value="variable">Tasa Variable</SelectItem>
                <SelectItem value="none">Sin tasa definida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rateType === "fixed" && (
            <div className="space-y-2">
              <Label>TNA (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 23.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Inicio</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de Vencimiento</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Estimated Return Preview */}
          {estimatedReturn && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 text-success mb-2">
                <Calculator className="h-4 w-4" />
                <span className="font-medium">Estimación al vencimiento</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Monto Final</p>
                  <p className="font-semibold text-success">
                    {formatCurrency(estimatedReturn.estimatedAmount, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ganancia ({estimatedReturn.days} días)</p>
                  <p className="font-semibold text-success">
                    +{formatCurrency(estimatedReturn.profit, currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="Detalles adicionales de la inversión..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Inversión</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};