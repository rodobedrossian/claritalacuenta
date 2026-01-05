import { format, parseISO, isBefore, startOfDay, parse, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, AlertCircle, CheckCircle, Clock, ChevronRight, Trash2, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatementImport } from "@/hooks/useCreditCardStatements";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StatementsListProps {
  statements: StatementImport[];
  creditCards: { id: string; name: string; bank: string | null }[];
  onSelectStatement: (statement: StatementImport) => void;
  onDeleteStatement: (statementId: string) => Promise<boolean>;
}

export const StatementsList = ({ 
  statements, 
  creditCards, 
  onSelectStatement,
  onDeleteStatement,
}: StatementsListProps) => {
  const handleDelete = async (e: React.MouseEvent, statementId: string) => {
    e.stopPropagation();
    const success = await onDeleteStatement(statementId);
    if (success) {
      toast.success("Resumen eliminado correctamente");
    } else {
      toast.error("Error al eliminar el resumen");
    }
  };
  
  const getCardName = (cardId: string | null) => {
    if (!cardId) return "Sin tarjeta";
    const card = creditCards.find(c => c.id === cardId);
    return card ? card.name : "Tarjeta desconocida";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completado
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Procesando
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getPaymentStatusBadge = (fechaVencimiento: string | undefined) => {
    if (!fechaVencimiento) return null;
    
    // Try to parse the date - it could be in DD/MM/YYYY format or ISO format
    let dueDate: Date;
    
    // First try parsing as DD/MM/YYYY (common format from PDF extraction)
    const parsedDMY = parse(fechaVencimiento, "dd/MM/yyyy", new Date());
    if (isValid(parsedDMY)) {
      dueDate = parsedDMY;
    } else {
      // Try ISO format
      dueDate = parseISO(fechaVencimiento);
      if (!isValid(dueDate)) {
        console.warn("Invalid date format for fecha_vencimiento:", fechaVencimiento);
        return null;
      }
    }
    
    const today = startOfDay(new Date());
    const isPaid = isBefore(dueDate, today);
    
    if (isPaid) {
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Pagado
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
          <Calendar className="h-3 w-3 mr-1" />
          Vence {format(dueDate, "dd/MM", { locale: es })}
        </Badge>
      );
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  if (statements.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay resúmenes importados</p>
        <p className="text-sm text-muted-foreground mt-1">
          Importá un resumen desde el Dashboard para comenzar
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {statements.map((statement) => {
        const extractedData = statement.extracted_data;
        const totalArs = extractedData?.resumen?.total_ars || 0;
        const totalUsd = extractedData?.resumen?.total_usd || 0;
        const fechaVencimiento = extractedData?.resumen?.fecha_vencimiento;
        
        return (
          <Card 
            key={statement.id} 
            className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onSelectStatement(statement)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {format(parseISO(statement.statement_month), "MMMM yyyy", { locale: es })}
                    </span>
                    {getStatusBadge(statement.status)}
                    {getPaymentStatusBadge(fechaVencimiento)}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span>{getCardName(statement.credit_card_id)}</span>
                    {statement.transactions_created > 0 && (
                      <span>• {statement.transactions_created} transacciones</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  {totalArs > 0 && (
                    <div className="font-semibold text-warning">
                      {formatCurrency(totalArs, "ARS")}
                    </div>
                  )}
                  {totalUsd > 0 && (
                    <div className="font-semibold text-warning">
                      {formatCurrency(totalUsd, "USD")}
                    </div>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar resumen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará el resumen y todas las transacciones asociadas. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={(e) => handleDelete(e, statement.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
