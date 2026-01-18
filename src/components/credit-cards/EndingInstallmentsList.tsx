import { MonthlyProjection } from "@/hooks/useInstallmentProjection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowUp, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

interface EndingInstallmentsListProps {
  projections: MonthlyProjection[];
}

export const EndingInstallmentsList = ({ projections }: EndingInstallmentsListProps) => {
  // Filter only months that have ending installments (next 6 months, skip current month)
  const monthsWithEnding = projections
    .slice(1, 7) // Start from next month (index 1)
    .filter(p => p.endingInstallments.length > 0);

  if (monthsWithEnding.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">
            No hay cuotas que terminen en los próximos 6 meses
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `US$${amount.toLocaleString()}`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatMonth = (date: Date) => {
    const formatted = format(date, "MMMM yyyy", { locale: es });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Default to first month open
  const defaultOpenValue = monthsWithEnding.length > 0 
    ? [monthsWithEnding[0].month.toISOString()] 
    : [];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Cuotas que Terminan Pronto
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Liberarás dinero cuando estas cuotas finalicen
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={defaultOpenValue} className="space-y-2">
          {monthsWithEnding.map((month) => {
            const totalFreedARS = month.endingInstallments
              .filter(i => i.currency === "ARS")
              .reduce((sum, i) => sum + i.amount, 0);
            
            const totalFreedUSD = month.endingInstallments
              .filter(i => i.currency === "USD")
              .reduce((sum, i) => sum + i.amount, 0);

            return (
              <AccordionItem 
                key={month.month.toISOString()} 
                value={month.month.toISOString()}
                className="border rounded-lg bg-muted/30 px-4"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 shrink-0">
                        📅 {formatMonth(month.month)}
                      </Badge>
                      <span className="text-sm text-muted-foreground truncate">
                        {month.endingInstallments.length === 1 
                          ? `Última cuota de ${month.endingInstallments[0].description.replace(/^\*\s*/, '').substring(0, 30)}${month.endingInstallments[0].description.length > 30 ? '...' : ''}`
                          : `Últimas cuotas de ${month.endingInstallments.map(i => i.description.replace(/^\*\s*/, '').split(' ')[0]).slice(0, 2).join(', ')}${month.endingInstallments.length > 2 ? ` y ${month.endingInstallments.length - 2} más` : ''}`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {totalFreedARS > 0 && (
                        <Badge className="bg-success/20 text-success hover:bg-success/30 border-0">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          ${totalFreedARS.toLocaleString()}
                        </Badge>
                      )}
                      {totalFreedUSD > 0 && (
                        <Badge className="bg-success/20 text-success hover:bg-success/30 border-0">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          US${totalFreedUSD.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-3">
                  <Table>
                    <TableBody>
                      {month.endingInstallments.map((installment) => (
                        <TableRow key={installment.id} className="border-0 hover:bg-background/50">
                          <TableCell className="py-2 pl-0">
                            <div>
                              <p className="text-sm font-medium">
                                {installment.description.replace(/^\*\s*/, '')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Cuota {installment.installmentCurrent} de {installment.installmentTotal}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 pr-0 text-right font-semibold whitespace-nowrap">
                            {formatCurrency(installment.amount, installment.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};
