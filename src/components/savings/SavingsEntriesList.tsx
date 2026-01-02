import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SavingsEntry } from "@/pages/Savings";

interface SavingsEntriesListProps {
  entries: SavingsEntry[];
}

export const SavingsEntriesList = ({ entries }: SavingsEntriesListProps) => {
  const getIcon = (type: SavingsEntry["entry_type"]) => {
    switch (type) {
      case "deposit":
        return <ArrowDownCircle className="h-5 w-5 text-success" />;
      case "withdrawal":
        return <ArrowUpCircle className="h-5 w-5 text-destructive" />;
      case "interest":
        return <Percent className="h-5 w-5 text-primary" />;
    }
  };

  const getLabel = (type: SavingsEntry["entry_type"]) => {
    switch (type) {
      case "deposit":
        return "Depósito";
      case "withdrawal":
        return "Retiro";
      case "interest":
        return "Interés";
    }
  };

  const formatCurrency = (amount: number, currency: "USD" | "ARS") => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay movimientos registrados</p>
          <p className="text-sm text-muted-foreground mt-2">
            Usa el botón "Movimiento" para registrar depósitos o retiros
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Movimientos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-4">
                {getIcon(entry.entry_type)}
                <div>
                  <p className="font-medium">{getLabel(entry.entry_type)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(entry.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  entry.entry_type === "withdrawal" ? "text-destructive" : "text-success"
                }`}>
                  {entry.entry_type === "withdrawal" ? "-" : "+"}
                  {formatCurrency(entry.amount, entry.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};