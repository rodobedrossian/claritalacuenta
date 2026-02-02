import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Check } from "lucide-react";

export type SurplusAllocation =
  | { allARS: true }
  | { allARS: false; arsAmount: number; usdAmount: number };

interface TransferSurplusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surplusTotalARS: number;
  exchangeRate: number;
  monthLabel: string;
  onConfirm: (allocation: SurplusAllocation) => Promise<void>;
  isSubmitting: boolean;
}

const formatCurrency = (amount: number, currency: "USD" | "ARS") => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const TOLERANCE_ARS = 1;

export function TransferSurplusModal({
  open,
  onOpenChange,
  surplusTotalARS,
  exchangeRate,
  monthLabel,
  onConfirm,
  isSubmitting,
}: TransferSurplusModalProps) {
  const isMobile = useIsMobile();
  const monthCapitalized = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const [allocationMode, setAllocationMode] = useState<"all" | "split" | null>(null);
  const [arsAmountStr, setArsAmountStr] = useState("");
  const [usdAmountStr, setUsdAmountStr] = useState("");
  const [splitError, setSplitError] = useState<string | null>(null);

  const arsNum = parseFloat(arsAmountStr) || 0;
  const usdNum = parseFloat(usdAmountStr) || 0;
  const currentTotalARS = arsNum + usdNum * exchangeRate;
  const isValidSplit = Math.abs(currentTotalARS - surplusTotalARS) <= TOLERANCE_ARS;

  const resetState = () => {
    setAllocationMode(null);
    setArsAmountStr("");
    setUsdAmountStr("");
    setSplitError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetState();
    onOpenChange(newOpen);
  };

  const handleArsChange = (value: string) => {
    setArsAmountStr(value);
    setSplitError(null);
  };

  const handleUsdChange = (value: string) => {
    setUsdAmountStr(value);
    setSplitError(null);
  };

  const validateAndSubmit = async () => {
    if (allocationMode === "all") {
      await onConfirm({ allARS: true });
      handleOpenChange(false);
      return;
    }

    if (allocationMode === "split") {
      const ars = parseFloat(arsAmountStr) || 0;
      const usd = parseFloat(usdAmountStr) || 0;
      if (ars < 0 || usd < 0) {
        setSplitError("Los montos no pueden ser negativos");
        return;
      }
      await onConfirm({ allARS: false, arsAmount: ars, usdAmount: usd });
      handleOpenChange(false);
    }
  };

  const previewArs = allocationMode === "all" ? surplusTotalARS : arsNum;
  const previewUsd = allocationMode === "all" ? 0 : usdNum;
  const previewTotalARS = previewArs + previewUsd * exchangeRate;
  const showPreview = allocationMode !== null;
  const hasDiscrepancy = allocationMode === "split" && !isValidSplit && (arsAmountStr || usdAmountStr);

  const content = (
    <div className="p-6 space-y-6">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="p-3 rounded-full bg-success/20">
          <Wallet className="h-8 w-8 text-success" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Transferir excedente a ahorros</h3>
          <p className="text-sm text-muted-foreground mt-1">
            De {monthCapitalized} te sobraron:
          </p>
        </div>
        <p className="text-lg font-bold text-success">{formatCurrency(surplusTotalARS, "ARS")}</p>
      </div>

      {allocationMode === null ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">¿Cómo querés agregarlo a ahorros?</p>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => setAllocationMode("all")}
            >
              Todo en ARS
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => {
                setAllocationMode("split");
                setArsAmountStr(String(Math.round(surplusTotalARS)));
                setUsdAmountStr("0");
                setSplitError(null);
              }}
            >
              Repartir entre ARS y USD
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {allocationMode === "split" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="surplus-ars">Monto en ARS</Label>
                <Input
                  id="surplus-ars"
                  type="number"
                  min={0}
                  step={1}
                  value={arsAmountStr}
                  onChange={(e) => handleArsChange(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surplus-usd">Monto en USD</Label>
                <Input
                  id="surplus-usd"
                  type="number"
                  min={0}
                  step={0.01}
                  value={usdAmountStr}
                  onChange={(e) => handleUsdChange(e.target.value)}
                  placeholder="0"
                />
              </div>
              {hasDiscrepancy && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Según la cotización de referencia, hay una diferencia con el excedente del mes. Igualmente podés crear las transacciones si estás seguro de que los montos son correctos.
                  </p>
                </div>
              )}
              {splitError && <p className="text-sm text-destructive">{splitError}</p>}
            </div>
          )}

          {showPreview && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">Así quedará tu ahorro</p>
              <div className="space-y-1 text-sm">
                {previewArs > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Depósito ARS</span>
                    <span className="font-medium">{formatCurrency(previewArs, "ARS")}</span>
                  </div>
                )}
                {previewUsd > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Depósito USD</span>
                    <span className="font-medium">{formatCurrency(previewUsd, "USD")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-muted-foreground">Total equivalente</span>
                  <span className="font-semibold flex items-center gap-1">
                    {formatCurrency(previewTotalARS, "ARS")}
                    {allocationMode === "split" && isValidSplit && (
                      <Check className="h-4 w-4 text-success shrink-0" />
                    )}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Nota: &quot;Excedente de {monthLabel}&quot;
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={validateAndSubmit}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Procesando..." : "Confirmar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setAllocationMode(null)}
              disabled={isSubmitting}
              className="w-full"
            >
              Volver
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <div className="pb-safe overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {content}
      </DialogContent>
    </Dialog>
  );
}
