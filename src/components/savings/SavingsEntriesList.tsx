import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle, Percent, Banknote, Building2, HelpCircle, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SavingsEntry } from "@/hooks/useSavingsData";

interface SavingsEntriesListProps {
  entries: SavingsEntry[];
  onEdit: (entry: SavingsEntry) => void;
}

export const SavingsEntriesList = ({ entries, onEdit }: SavingsEntriesListProps) => {
  const getTypeIcon = (type: SavingsEntry["entry_type"]) => {
    switch (type) {
      case "deposit":
        return <ArrowDownCircle className="h-5 w-5 text-success" />;
      case "withdrawal":
        return <ArrowUpCircle className="h-5 w-5 text-destructive" />;
      case "interest":
        return <Percent className="h-5 w-5 text-primary" />;
    }
  };

  const getTypeLabel = (type: SavingsEntry["entry_type"]) => {
    switch (type) {
      case "deposit":
        return "Depósito";
      case "withdrawal":
        return "Retiro";
      case "interest":
        return "Interés";
    }
  };

  const getSavingsTypeLabel = (type: SavingsEntry["savings_type"]) => {
    switch (type) {
      case "cash":
        return { label: "Efectivo", icon: Banknote };
      case "bank":
        return { label: "Banco", icon: Building2 };
      case "other":
        return { label: "Otro", icon: HelpCircle };
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
          {entries.map((entry) => {
            const savingsTypeInfo = getSavingsTypeLabel(entry.savings_type || "cash");
            const SavingsIcon = savingsTypeInfo.icon;
            
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-4">
                  {getTypeIcon(entry.entry_type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{getTypeLabel(entry.entry_type)}</p>
                      <Badge variant="outline" className="text-xs">
                        <SavingsIcon className="h-3 w-3 mr-1" />
                        {savingsTypeInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(entry.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-semibold ${
                      entry.entry_type === "withdrawal" ? "text-destructive" : "text-success"
                    }`}>
                      {entry.entry_type === "withdrawal" ? "-" : "+"}
                      {formatCurrency(entry.amount, entry.currency)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onEdit(entry)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};