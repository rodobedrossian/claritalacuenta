import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PreviousMonthSurplusBannerProps {
  surplusTotalARS: number;
  monthLabel: string;
  onAddToSavings: () => void;
  onDismiss: () => void;
  /** "full" = card (mobile); "compact" = single-line bar (desktop) */
  variant?: "full" | "compact";
}

const formatCurrency = (amount: number, currency: "USD" | "ARS") => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function PreviousMonthSurplusBanner({
  surplusTotalARS,
  monthLabel,
  onAddToSavings,
  onDismiss,
  variant = "full",
}: PreviousMonthSurplusBannerProps) {
  const monthCapitalized = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-xl bg-success/5 border border-success/20">
        <p className="text-sm text-foreground">
          Te sobró {formatCurrency(surplusTotalARS, "ARS")} en {monthCapitalized}. Cerraste con balance positivo.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground h-8"
          >
            Ahora no
          </Button>
          <Button
            size="sm"
            onClick={onAddToSavings}
            className="bg-success hover:bg-success/90 text-white h-8"
          >
            Agregar a ahorros
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-success/20 bg-gradient-to-br from-success/5 to-success/10">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5">
          {/* Header: icon + title */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-success/15 shrink-0">
              <Wallet className="h-5 w-5 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base text-foreground">
                Te sobró en {monthCapitalized}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Cerraste con un balance positivo
              </p>
            </div>
          </div>

          {/* Amount - hero block */}
          <div className="rounded-xl bg-success/10 px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Disponible para ahorros
            </p>
            <p className="text-xl sm:text-2xl font-bold text-success tabular-nums">
              {formatCurrency(surplusTotalARS, "ARS")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="flex-1 sm:flex-initial order-2 sm:order-1 text-muted-foreground hover:text-foreground"
            >
              Ahora no
            </Button>
            <Button
              size="sm"
              onClick={onAddToSavings}
              className="flex-1 sm:flex-initial order-1 sm:order-2 bg-success hover:bg-success/90 text-white font-medium"
            >
              Agregar a ahorros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
