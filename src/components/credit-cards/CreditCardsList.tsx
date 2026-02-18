import { CreditCard, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { CreditCard as CreditCardType } from "@/hooks/useCreditCardsData";

interface CreditCardsListProps {
  creditCards: CreditCardType[];
  onDelete: (id: string) => Promise<void>;
}

export const CreditCardsList = ({ creditCards, onDelete }: CreditCardsListProps) => {
  if (creditCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/50 rounded-lg">
        <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No hay tarjetas registradas</h3>
        <p className="text-sm text-muted-foreground">
          Agrega tus tarjetas de crédito para hacer seguimiento de gastos proyectados
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>N° Cuenta</TableHead>
          <TableHead>Banco</TableHead>
          <TableHead>Red</TableHead>
          <TableHead>Cierre</TableHead>
          <TableHead className="w-[100px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {creditCards.map((card) => (
          <TableRow key={card.id}>
            <TableCell className="font-medium">{card.name}</TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {card.account_number || "-"}
            </TableCell>
            <TableCell>{card.bank || "-"}</TableCell>
            <TableCell>{card.card_network || "-"}</TableCell>
            <TableCell>{card.closing_day || "-"}</TableCell>
            <TableCell>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar tarjeta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Los gastos asociados a esta tarjeta mantendrán su historial pero ya no estarán vinculados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(card.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
