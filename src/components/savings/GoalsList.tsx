import { format, parseISO, differenceInMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Target, Check, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SavingsGoal } from "@/pages/Savings";

interface GoalsListProps {
  goals: SavingsGoal[];
  currentSavings: { usd: number; ars: number };
  totalInvested: { usd: number; ars: number };
  exchangeRate: number;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export const GoalsList = ({ 
  goals, 
  currentSavings, 
  totalInvested, 
  exchangeRate,
  onToggleComplete,
  onDelete 
}: GoalsListProps) => {
  const formatCurrency = (amount: number, currency: "USD" | "ARS") => {
    return `${currency} ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const calculateProgress = (goal: SavingsGoal) => {
    // Calculate total savings in goal's currency
    let totalInCurrency: number;
    
    if (goal.currency === "USD") {
      totalInCurrency = currentSavings.usd + totalInvested.usd + 
        ((currentSavings.ars + totalInvested.ars) / exchangeRate);
    } else {
      totalInCurrency = currentSavings.ars + totalInvested.ars + 
        ((currentSavings.usd + totalInvested.usd) * exchangeRate);
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

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay objetivos definidos</p>
          <p className="text-sm text-muted-foreground mt-2">
            Usa el botón "Objetivo" para definir una meta de ahorro
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {goals.map((goal) => {
        const { totalInCurrency, progress, remaining } = calculateProgress(goal);
        const monthlyNeeded = calculateMonthlyNeeded(goal, remaining);
        
        return (
          <Card key={goal.id} className={goal.is_completed ? "border-success/50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Target className={`h-5 w-5 ${goal.is_completed ? "text-success" : "text-primary"}`} />
                  <div>
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                    {goal.is_completed && (
                      <Badge variant="outline" className="text-success border-success mt-1">
                        ¡Completado!
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleComplete(goal.id, !goal.is_completed)}
                    className="text-muted-foreground hover:text-success"
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
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Target Amount */}
              <div>
                <p className="text-sm text-muted-foreground">Objetivo</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(goal.target_amount, goal.currency)}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={progress} 
                  className={`h-3 ${goal.is_completed ? "[&>div]:bg-success" : ""}`}
                />
              </div>

              {/* Current vs Remaining */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Acumulado</p>
                  <p className="font-semibold text-success">
                    {formatCurrency(totalInCurrency, goal.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Faltante</p>
                  <p className="font-semibold">
                    {formatCurrency(remaining, goal.currency)}
                  </p>
                </div>
              </div>

              {/* Target Date */}
              {goal.target_date && (
                <div className="text-sm text-muted-foreground">
                  Fecha objetivo: {format(parseISO(goal.target_date), "d MMMM yyyy", { locale: es })}
                </div>
              )}

              {/* Monthly Needed */}
              {monthlyNeeded && !goal.is_completed && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Necesitas ahorrar{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(monthlyNeeded, goal.currency)}
                    </span>
                    {" "}por mes para alcanzar tu objetivo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};