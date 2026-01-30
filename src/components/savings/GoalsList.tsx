import { useState } from "react";
import { format, parseISO, differenceInMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Check, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SavingsGoal } from "@/hooks/useSavingsData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";

interface GoalsListProps {
  goals: SavingsGoal[];
  currentSavings: { usd: number; ars: number };
  totalInvested: { usd: number; ars: number };
  exchangeRate: number;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

type SortField = "name" | "target" | "progress" | "remaining" | "date" | "monthly";
type SortDirection = "asc" | "desc";

export const GoalsList = ({
  goals,
  currentSavings,
  totalInvested,
  exchangeRate,
  onToggleComplete,
  onDelete,
}: GoalsListProps) => {
  const isMobile = useIsMobile();
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const formatCurrency = (amount: number, currency: "USD" | "ARS") => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const calculateProgress = (goal: SavingsGoal) => {
    let totalInCurrency: number;

    if (goal.currency === "USD") {
      totalInCurrency =
        currentSavings.usd +
        totalInvested.usd +
        (currentSavings.ars + totalInvested.ars) / exchangeRate;
    } else {
      totalInCurrency =
        currentSavings.ars +
        totalInvested.ars +
        (currentSavings.usd + totalInvested.usd) * exchangeRate;
    }

    const progress = Math.min(100, (totalInCurrency / goal.target_amount) * 100);
    const remaining = Math.max(0, goal.target_amount - totalInCurrency);

    return { totalInCurrency, progress, remaining };
  };

  const calculateMonthlyNeeded = (goal: SavingsGoal, remaining: number) => {
    if (!goal.target_date || remaining <= 0) return null;

    const monthsRemaining = differenceInMonths(parseISO(goal.target_date), new Date());

    if (monthsRemaining <= 0) return null;

    return remaining / monthsRemaining;
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

  const getGoalData = (goal: SavingsGoal) => {
    const { totalInCurrency, progress, remaining } = calculateProgress(goal);
    const monthlyNeeded = calculateMonthlyNeeded(goal, remaining);
    return { totalInCurrency, progress, remaining, monthlyNeeded };
  };

  const sortedGoals = [...goals].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    const aData = getGoalData(a);
    const bData = getGoalData(b);

    switch (sortField) {
      case "name":
        return multiplier * a.name.localeCompare(b.name);
      case "target":
        const aTarget =
          a.currency === "USD" ? a.target_amount * exchangeRate : a.target_amount;
        const bTarget =
          b.currency === "USD" ? b.target_amount * exchangeRate : b.target_amount;
        return multiplier * (aTarget - bTarget);
      case "progress":
        return multiplier * (aData.progress - bData.progress);
      case "remaining":
        const aRemaining =
          a.currency === "USD" ? aData.remaining * exchangeRate : aData.remaining;
        const bRemaining =
          b.currency === "USD" ? bData.remaining * exchangeRate : bData.remaining;
        return multiplier * (aRemaining - bRemaining);
      case "date":
        if (!a.target_date && !b.target_date) return 0;
        if (!a.target_date) return multiplier;
        if (!b.target_date) return -multiplier;
        return (
          multiplier * (new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
        );
      case "monthly":
        return (
          multiplier *
          ((aData.monthlyNeeded || Infinity) - (bData.monthlyNeeded || Infinity))
        );
      default:
        return 0;
    }
  });

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay objetivos definidos</p>
          <p className="text-sm text-muted-foreground mt-2">
            Usa el botón &quot;Objetivo&quot; para definir una meta de ahorro
          </p>
        </CardContent>
      </Card>
    );
  }

  /** Mobile: Card layout - iOS-style stacked content */
  const GoalCard = ({ goal }: { goal: SavingsGoal }) => {
    const { totalInCurrency, progress, remaining, monthlyNeeded } = getGoalData(goal);

    return (
      <Card className={goal.is_completed ? "bg-success/5 border-success/20" : ""}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{goal.name}</p>
                  <p className="text-sm font-bold text-primary">
                    Meta: {formatCurrency(goal.target_amount, goal.currency)}
                  </p>
                </div>
                {goal.is_completed && (
                  <Badge variant="outline" className="text-success border-success shrink-0">
                    Completado
                  </Badge>
                )}
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium">{progress.toFixed(0)}%</span>
                </div>
                <Progress
                  value={progress}
                  className={`h-2 ${goal.is_completed ? "[&>div]:bg-success" : ""}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Acumulado</p>
                  <p className="font-semibold text-success">
                    {formatCurrency(totalInCurrency, goal.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Faltante</p>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(remaining, goal.currency)}
                  </p>
                </div>
              </div>

              {goal.target_date && (
                <p className="text-xs text-muted-foreground mt-2">
                  Fecha objetivo: {format(parseISO(goal.target_date), "dd MMM yyyy", { locale: es })}
                </p>
              )}

              {monthlyNeeded && !goal.is_completed && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ahorro mensual sugerido: {formatCurrency(monthlyNeeded, goal.currency)}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleComplete(goal.id, !goal.is_completed)}
                className="h-9 w-9 text-muted-foreground hover:text-success"
                title={goal.is_completed ? "Reabrir objetivo" : "Marcar como completado"}
              >
                {goal.is_completed ? (
                  <RotateCcw className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(goal.id)}
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {sortedGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
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
                  Objetivo {getSortIcon("name")}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-medium hover:bg-transparent ml-auto"
                  onClick={() => handleSort("target")}
                >
                  Meta {getSortIcon("target")}
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
              <TableHead className="text-right">Acumulado</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-medium hover:bg-transparent ml-auto"
                  onClick={() => handleSort("remaining")}
                >
                  Faltante {getSortIcon("remaining")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-medium hover:bg-transparent"
                  onClick={() => handleSort("date")}
                >
                  Fecha {getSortIcon("date")}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-medium hover:bg-transparent ml-auto"
                  onClick={() => handleSort("monthly")}
                >
                  Mensual {getSortIcon("monthly")}
                </Button>
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGoals.map((goal) => {
              const { totalInCurrency, progress, remaining, monthlyNeeded } =
                getGoalData(goal);

              return (
                <TableRow
                  key={goal.id}
                  className={goal.is_completed ? "bg-success/5" : ""}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{goal.name}</span>
                      {goal.is_completed && (
                        <Badge
                          variant="outline"
                          className="text-success border-success text-xs"
                        >
                          ✓
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(goal.target_amount, goal.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress
                        value={progress}
                        className={`h-2 flex-1 ${goal.is_completed ? "[&>div]:bg-success" : ""}`}
                      />
                      <span className="text-xs font-medium whitespace-nowrap">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-success font-medium">
                    {formatCurrency(totalInCurrency, goal.currency)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(remaining, goal.currency)}
                  </TableCell>
                  <TableCell>
                    {goal.target_date
                      ? format(parseISO(goal.target_date), "dd/MM/yy", { locale: es })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {monthlyNeeded && !goal.is_completed ? (
                      <span className="text-sm">
                        {formatCurrency(monthlyNeeded, goal.currency)}
                      </span>
                    ) : goal.is_completed ? (
                      <span className="text-success text-sm">-</span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleComplete(goal.id, !goal.is_completed)}
                        className="h-8 w-8 text-muted-foreground hover:text-success"
                        title={
                          goal.is_completed ? "Reabrir objetivo" : "Marcar como completado"
                        }
                      >
                        {goal.is_completed ? (
                          <RotateCcw className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(goal.id)}
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
