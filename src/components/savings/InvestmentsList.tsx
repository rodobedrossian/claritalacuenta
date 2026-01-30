import { useState, useEffect, useRef } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, ArrowUpDown, ArrowUp, ArrowDown, Wallet, RotateCcw, ChevronDown, ChevronUp, RotateCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Investment } from "@/hooks/useSavingsData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/** Amount to use when reinvesting: estimated at maturity (with interest) if available, else current */
export const getReinvestAmount = (investment: Investment): number => {
  if (
    investment.rate_type === "fixed" &&
    investment.interest_rate &&
    investment.end_date
  ) {
    const startDate = parseISO(investment.start_date);
    const endDate = parseISO(investment.end_date);
    const days = differenceInDays(endDate, startDate);
    return (
      investment.principal_amount *
      (1 + (investment.interest_rate / 100) * (days / 365))
    );
  }
  return investment.current_amount;
};

interface InvestmentsListProps {
  investments: Investment[];
  onDelete: (id: string) => void;
  onLiquidate?: (id: string) => Promise<void>;
  onReinvest?: (investment: Investment, amount: number) => void;
  onReactivate?: (id: string) => Promise<void>;
  exchangeRate: number;
}

const investmentTypeLabels: Record<Investment["investment_type"], string> = {
  plazo_fijo: "Plazo Fijo",
  fci: "FCI",
  cedear: "CEDEAR",
  cripto: "Cripto",
  otro: "Otro",
};

type SortField = "name" | "type" | "principal" | "current" | "rate" | "end_date" | "progress";
type SortDirection = "asc" | "desc";

const isMatured = (inv: Investment) => {
  if (!inv.end_date) return false;
  return new Date(inv.end_date) < new Date() && inv.is_active;
};

export const InvestmentsList = ({
  investments,
  onDelete,
  onLiquidate,
  onReinvest,
  onReactivate,
  exchangeRate,
}: InvestmentsListProps) => {
  const isMobile = useIsMobile();
  const [sortField, setSortField] = useState<SortField>("end_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const hasAutoExpanded = useRef(false);

  // Auto-expand first matured investment once so action buttons are visible
  useEffect(() => {
    if (hasAutoExpanded.current) return;
    const firstMatured = investments.find((i) => isMatured(i));
    if (firstMatured) {
      hasAutoExpanded.current = true;
      setExpandedCard(firstMatured.id);
    }
  }, [investments]);

  const formatCurrency = (amount: number, currency: "USD" | "ARS") => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const calculateEstimatedReturn = (investment: Investment) => {
    if (investment.rate_type !== "fixed" || !investment.interest_rate || !investment.end_date) {
      return null;
    }

    const startDate = parseISO(investment.start_date);
    const endDate = parseISO(investment.end_date);
    const days = differenceInDays(endDate, startDate);

    const estimatedAmount =
      investment.principal_amount *
      (1 + (investment.interest_rate / 100) * (days / 365));
    const profit = estimatedAmount - investment.principal_amount;

    return { estimatedAmount, profit, days };
  };

  const getTimeProgress = (investment: Investment) => {
    if (!investment.end_date) return null;

    const startDate = parseISO(investment.start_date);
    const endDate = parseISO(investment.end_date);
    const today = new Date();

    const totalDays = differenceInDays(endDate, startDate);
    const elapsedDays = differenceInDays(today, startDate);
    const remainingDays = differenceInDays(endDate, today);

    const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

    return { progress, remainingDays, totalDays };
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const sortedInvestments = [...investments].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "name":
        return multiplier * a.name.localeCompare(b.name);
      case "type":
        return multiplier * a.investment_type.localeCompare(b.investment_type);
      case "principal":
        const aPrincipal =
          a.currency === "USD" ? a.principal_amount * exchangeRate : a.principal_amount;
        const bPrincipal =
          b.currency === "USD" ? b.principal_amount * exchangeRate : b.principal_amount;
        return multiplier * (aPrincipal - bPrincipal);
      case "current":
        const aCurrent =
          a.currency === "USD" ? a.current_amount * exchangeRate : a.current_amount;
        const bCurrent =
          b.currency === "USD" ? b.current_amount * exchangeRate : b.current_amount;
        return multiplier * (aCurrent - bCurrent);
      case "rate":
        return multiplier * ((a.interest_rate || 0) - (b.interest_rate || 0));
      case "end_date":
        if (!a.end_date && !b.end_date) return 0;
        if (!a.end_date) return multiplier;
        if (!b.end_date) return -multiplier;
        return multiplier * (new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
      case "progress":
        const aProgress = getTimeProgress(a)?.progress || 0;
        const bProgress = getTimeProgress(b)?.progress || 0;
        return multiplier * (aProgress - bProgress);
      default:
        return 0;
    }
  });

  /** Mobile: Card layout */
  const InvestmentCard = ({ investment }: { investment: Investment }) => {
    const estimatedReturn = calculateEstimatedReturn(investment);
    const timeProgress = getTimeProgress(investment);
    const matured = isMatured(investment);
    const isExpanded = expandedCard === investment.id;

    return (
      <Collapsible
        open={isExpanded}
        onOpenChange={(open) => setExpandedCard(open ? investment.id : null)}
      >
        <Card
          className={`overflow-hidden transition-all ${
            !investment.is_active ? "opacity-70" : ""
          } ${matured ? "border-amber-500/50 ring-1 ring-amber-500/20" : ""}`}
        >
          <CollapsibleTrigger asChild>
            <CardContent className="p-4 active:bg-muted/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground truncate">
                      {investment.name}
                    </span>
                    {matured && (
                      <Badge variant="outline" className="text-amber-600 border-amber-500/50 bg-amber-500/10">
                        Vencida
                      </Badge>
                    )}
                    {!investment.is_active && (
                      <Badge variant="secondary">Finalizada</Badge>
                    )}
                  </div>
                  {investment.institution && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {investment.institution}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs font-normal">
                      {investmentTypeLabels[investment.investment_type]}
                    </Badge>
                    <span className="text-base font-bold text-foreground">
                      {formatCurrency(investment.current_amount, investment.currency)}
                    </span>
                  </div>
                  {timeProgress && investment.is_active && !matured && (
                    <div className="mt-2">
                      <Progress value={timeProgress.progress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {timeProgress.remainingDays > 0
                          ? `Vence en ${timeProgress.remainingDays} días`
                          : "Vencido"}
                      </p>
                    </div>
                  )}
                  {investment.end_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Venc: {format(parseISO(investment.end_date), "dd/MM/yy", { locale: es })}
                    </p>
                  )}
                  {/* Matured: show action buttons on collapsed card too */}
                  {matured && onLiquidate && (
                    <div className="flex flex-wrap gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 gap-1.5 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLiquidate(investment.id);
                        }}
                      >
                        <Wallet className="h-3.5 w-3.5" />
                        Sumar a líquidos
                      </Button>
                      {onReinvest && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCard(null);
                            onReinvest(investment, getReinvestAmount(investment));
                          }}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reinvertir
                        </Button>
                      )}
                    </div>
                  )}
                  {/* Finalizada: allow reactivate on collapsed card */}
                  {!investment.is_active && onReactivate && investment.end_date && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReactivate(investment.id);
                        }}
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        Reactivar
                      </Button>
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border/50">
              <div className="grid grid-cols-2 gap-2 text-sm pt-3">
                <div>
                  <p className="text-muted-foreground">Capital</p>
                  <p className="font-medium">
                    {formatCurrency(investment.principal_amount, investment.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">TNA</p>
                  <p className="font-medium">
                    {investment.interest_rate ? `${investment.interest_rate}%` : "-"}
                  </p>
                </div>
              </div>
              {estimatedReturn && (
                <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                  <p className="text-xs text-muted-foreground">Estimado al vencimiento</p>
                  <p className="font-bold text-success">
                    {formatCurrency(estimatedReturn.estimatedAmount, investment.currency)}
                  </p>
                  <p className="text-xs text-success">
                    +{formatCurrency(estimatedReturn.profit, investment.currency)} interés
                  </p>
                </div>
              )}

              {/* Matured: quick actions */}
              {matured && onLiquidate && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-medium text-amber-600">
                    Esta inversión venció. ¿Qué querés hacer?
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full justify-start gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLiquidate(investment.id);
                      }}
                    >
                      <Wallet className="h-4 w-4" />
                      Sumar a líquidos
                    </Button>
                    {onReinvest && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCard(null);
                          onReinvest(investment, getReinvestAmount(investment));
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reinvertir
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Finalizada: allow reactivate if wrongly marked (e.g. closed reinvest without confirming) */}
              {!investment.is_active && onReactivate && investment.end_date && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReactivate(investment.id);
                  }}
                >
                  <RotateCw className="h-4 w-4" />
                  Reactivar inversión
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(investment.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar inversión
              </Button>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  if (investments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay inversiones registradas</p>
          <p className="text-sm text-muted-foreground mt-2">
            Usa el botón &quot;Inversión&quot; para agregar una nueva inversión
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {sortedInvestments.map((investment) => (
          <InvestmentCard key={investment.id} investment={investment} />
        ))}
      </div>
    );
  }

  /** Desktop: Table layout */
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-medium hover:bg-transparent"
                  onClick={() => handleSort("name")}
                >
                  Nombre {getSortIcon("name")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-medium hover:bg-transparent"
                  onClick={() => handleSort("type")}
                >
                  Tipo {getSortIcon("type")}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-medium hover:bg-transparent ml-auto"
                  onClick={() => handleSort("principal")}
                >
                  Capital {getSortIcon("principal")}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-medium hover:bg-transparent ml-auto"
                  onClick={() => handleSort("current")}
                >
                  Actual {getSortIcon("current")}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-medium hover:bg-transparent ml-auto"
                  onClick={() => handleSort("rate")}
                >
                  TNA {getSortIcon("rate")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-medium hover:bg-transparent"
                  onClick={() => handleSort("end_date")}
                >
                  Vencimiento {getSortIcon("end_date")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-medium hover:bg-transparent"
                  onClick={() => handleSort("progress")}
                >
                  Progreso {getSortIcon("progress")}
                </Button>
              </TableHead>
              <TableHead className="text-right">Estimado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvestments.map((investment) => {
              const estimatedReturn = calculateEstimatedReturn(investment);
              const timeProgress = getTimeProgress(investment);
              const matured = isMatured(investment);

              return (
                <TableRow
                  key={investment.id}
                  className={`${!investment.is_active ? "opacity-60" : ""} ${matured ? "bg-amber-500/5" : ""}`}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{investment.name}</span>
                        {matured && (
                          <Badge variant="outline" className="text-amber-600 border-amber-500/50 text-xs">
                            Vencida
                          </Badge>
                        )}
                      </div>
                      {investment.institution && (
                        <span className="text-xs text-muted-foreground">
                          {investment.institution}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="whitespace-nowrap">
                      {investmentTypeLabels[investment.investment_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(investment.principal_amount, investment.currency)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(investment.current_amount, investment.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {investment.interest_rate ? `${investment.interest_rate}%` : "-"}
                  </TableCell>
                  <TableCell>
                    {investment.end_date
                      ? format(parseISO(investment.end_date), "dd/MM/yy", { locale: es })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {timeProgress ? (
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={timeProgress.progress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {timeProgress.remainingDays > 0
                            ? `${timeProgress.remainingDays}d`
                            : "Vencido"}
                        </span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {estimatedReturn ? (
                      <div className="flex flex-col items-end">
                        <span className="text-success font-medium">
                          {formatCurrency(estimatedReturn.estimatedAmount, investment.currency)}
                        </span>
                        <span className="text-xs text-success">
                          +{formatCurrency(estimatedReturn.profit, investment.currency)}
                        </span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {matured && onLiquidate && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => onLiquidate(investment.id)}
                        >
                          Sumar a líquidos
                        </Button>
                      )}
                      {matured && onReinvest && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => onReinvest(investment, getReinvestAmount(investment))}
                        >
                          Reinvertir
                        </Button>
                      )}
                      {!investment.is_active && onReactivate && investment.end_date && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => onReactivate(investment.id)}
                        >
                          Reactivar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(investment.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
