import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CreditCard {
  id: string;
  name: string;
  bank: string | null;
  closing_day: number | null;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
}

interface ReconcileCreditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditCard: CreditCard | null;
  activeMonth: Date;
  onReconcileComplete: () => void;
}

export const ReconcileCreditCardDialog = ({
  open,
  onOpenChange,
  creditCard,
  activeMonth,
  onReconcileComplete
}: ReconcileCreditCardDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [projectedTransactions, setProjectedTransactions] = useState<Transaction[]>([]);
  const [actualAmountARS, setActualAmountARS] = useState("");
  const [actualAmountUSD, setActualAmountUSD] = useState("");
  const [markAsReconciled, setMarkAsReconciled] = useState(true);

  useEffect(() => {
    if (open && creditCard) {
      fetchProjectedTransactions();
    }
  }, [open, creditCard, activeMonth]);

  const fetchProjectedTransactions = async () => {
    if (!creditCard) return;

    const monthStart = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
    const monthEnd = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    const { data, error } = await supabase
      .from("transactions")
      .select("id, amount, currency, category, description, date")
      .eq("credit_card_id", creditCard.id)
      .eq("is_projected", true)
      .gte("date", monthStart.toISOString())
      .lte("date", monthEnd.toISOString())
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching projected transactions:", error);
      return;
    }

    setProjectedTransactions(data?.map(t => ({
      ...t,
      amount: typeof t.amount === "string" ? parseFloat(t.amount) : t.amount
    })) || []);
  };

  const totalProjected = {
    usd: projectedTransactions.filter(t => t.currency === "USD").reduce((sum, t) => sum + t.amount, 0),
    ars: projectedTransactions.filter(t => t.currency === "ARS").reduce((sum, t) => sum + t.amount, 0)
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const handleReconcile = async () => {
    if (!creditCard) return;

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) throw new Error("No authenticated");

      const actualARS = parseFloat(actualAmountARS) || 0;
      const actualUSD = parseFloat(actualAmountUSD) || 0;

      // Create payment transaction(s) for the credit card statement
      const transactions: any[] = [];
      
      if (actualARS > 0) {
        transactions.push({
          user_id: userId,
          type: "expense",
          amount: actualARS,
          currency: "ARS",
          category: "Credit Cards",
          description: `Pago resumen ${creditCard.name} - ${format(activeMonth, "MMMM yyyy")}`,
          date: new Date().toISOString(),
          payment_method: "debit",
          is_projected: false
        });
      }

      if (actualUSD > 0) {
        transactions.push({
          user_id: userId,
          type: "expense",
          amount: actualUSD,
          currency: "USD",
          category: "Credit Cards",
          description: `Pago resumen ${creditCard.name} - ${format(activeMonth, "MMMM yyyy")}`,
          date: new Date().toISOString(),
          payment_method: "debit",
          is_projected: false
        });
      }

      if (transactions.length > 0) {
        const { error: insertError } = await supabase
          .from("transactions")
          .insert(transactions);

        if (insertError) throw insertError;
      }

      // Mark projected transactions as reconciled (no longer projected)
      if (markAsReconciled && projectedTransactions.length > 0) {
        const { error: updateError } = await supabase
          .from("transactions")
          .update({ is_projected: false })
          .in("id", projectedTransactions.map(t => t.id));

        if (updateError) throw updateError;
      }

      toast.success("Resumen reconciliado correctamente");
      onReconcileComplete();
      onOpenChange(false);
      setActualAmountARS("");
      setActualAmountUSD("");
    } catch (err: any) {
      console.error("Error reconciling:", err);
      toast.error("Error al reconciliar");
    } finally {
      setLoading(false);
    }
  };

  const differenceARS = (parseFloat(actualAmountARS) || 0) - totalProjected.ars;
  const differenceUSD = (parseFloat(actualAmountUSD) || 0) - totalProjected.usd;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Reconciliar Resumen de TC</DialogTitle>
          <DialogDescription>
            {creditCard?.name} - {format(activeMonth, "MMMM yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Projected Transactions Summary */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm font-medium mb-2">Gastos registrados este mes</p>
            <div className="flex gap-4 mb-2">
              {totalProjected.usd > 0 && (
                <span className="text-lg font-bold">{formatCurrency(totalProjected.usd, "USD")}</span>
              )}
              {totalProjected.ars > 0 && (
                <span className="text-lg font-bold">{formatCurrency(totalProjected.ars, "ARS")}</span>
              )}
              {totalProjected.usd === 0 && totalProjected.ars === 0 && (
                <span className="text-muted-foreground">Sin gastos proyectados</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{projectedTransactions.length} transacciones</p>
          </div>

          {/* Transaction List */}
          {projectedTransactions.length > 0 && (
            <ScrollArea className="h-[150px] rounded-md border border-border/50 p-2">
              <div className="space-y-2">
                {projectedTransactions.map(t => (
                  <div key={t.id} className="flex justify-between text-sm p-2 rounded bg-card">
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{t.category}</p>
                    </div>
                    <span className="font-mono">{formatCurrency(t.amount, t.currency)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Actual Amount Inputs */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Monto real del resumen</p>
            
            {(totalProjected.ars > 0 || !actualAmountUSD) && (
              <div className="space-y-2">
                <Label htmlFor="actualARS">Monto en ARS</Label>
                <Input
                  id="actualARS"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={actualAmountARS}
                  onChange={(e) => setActualAmountARS(e.target.value)}
                  className="bg-muted border-border"
                />
                {actualAmountARS && differenceARS !== 0 && (
                  <div className={`flex items-center gap-2 text-sm ${differenceARS > 0 ? "text-destructive" : "text-primary"}`}>
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Diferencia: {differenceARS > 0 ? "+" : ""}{formatCurrency(differenceARS, "ARS")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {(totalProjected.usd > 0 || !actualAmountARS) && (
              <div className="space-y-2">
                <Label htmlFor="actualUSD">Monto en USD</Label>
                <Input
                  id="actualUSD"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={actualAmountUSD}
                  onChange={(e) => setActualAmountUSD(e.target.value)}
                  className="bg-muted border-border"
                />
                {actualAmountUSD && differenceUSD !== 0 && (
                  <div className={`flex items-center gap-2 text-sm ${differenceUSD > 0 ? "text-destructive" : "text-primary"}`}>
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Diferencia: {differenceUSD > 0 ? "+" : ""}{formatCurrency(differenceUSD, "USD")}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mark as reconciled checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="markReconciled" 
              checked={markAsReconciled}
              onCheckedChange={(checked) => setMarkAsReconciled(checked as boolean)}
            />
            <Label htmlFor="markReconciled" className="text-sm cursor-pointer">
              Marcar gastos proyectados como reconciliados
            </Label>
          </div>

          <Button 
            onClick={handleReconcile} 
            disabled={loading || (!actualAmountARS && !actualAmountUSD)}
            className="w-full gradient-primary hover:opacity-90"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Reconciliar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
