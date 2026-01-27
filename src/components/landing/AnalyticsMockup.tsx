import { motion } from "framer-motion";
import { TrendingUp, Lightbulb, Target, CreditCard } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const budgetData = [
  { category: "Supermercado", spent: 75000, limit: 100000, color: "bg-blue-500" },
  { category: "Transporte", spent: 28000, limit: 40000, color: "bg-purple-500" },
  { category: "Entretenimiento", spent: 45000, limit: 35000, color: "bg-pink-500" },
];

const installments = [
  { name: "iPhone 15", remaining: 6, monthly: 85000 },
  { name: "Smart TV", remaining: 3, monthly: 42000 },
  { name: "Notebook", remaining: 9, monthly: 65000 },
];

export const AnalyticsMockup = () => {
  return (
    <div className="space-y-6">
      {/* Insight Card */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-5 border border-amber-200/50 dark:border-amber-800/30"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              💡 Insight del mes
            </h4>
            <p className="text-sm text-muted-foreground">
              Gastaste <span className="font-semibold text-amber-600">32% más</span> en 
              delivery este mes. El ticket promedio subió de $4.200 a $5.800.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Budget Progress */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-card rounded-2xl p-5 border border-border/50 shadow-stripe"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Presupuestos</h4>
        </div>
        <div className="space-y-4">
          {budgetData.map((budget, i) => {
            const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
            const isOver = budget.spent > budget.limit;
            
            return (
              <motion.div
                key={budget.category}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">{budget.category}</span>
                  <span className={`font-medium ${isOver ? "text-destructive" : "text-foreground"}`}>
                    ${(budget.spent / 1000).toFixed(0)}k / ${(budget.limit / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                    className={`absolute left-0 top-0 h-full rounded-full ${
                      isOver ? "bg-destructive" : budget.color
                    }`}
                  />
                </div>
                {isOver && (
                  <p className="text-xs text-destructive mt-1">
                    ⚠️ Excedido por ${((budget.spent - budget.limit) / 1000).toFixed(0)}k
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Installment Projection */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card rounded-2xl p-5 border border-border/50 shadow-stripe"
      >
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Cuotas pendientes</h4>
        </div>
        <div className="space-y-3">
          {installments.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.remaining} cuotas restantes
                </p>
              </div>
              <span className="text-sm font-semibold text-foreground">
                ${(item.monthly / 1000).toFixed(0)}k/mes
              </span>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total mensual en cuotas</span>
            <span className="text-sm font-bold text-primary">$192.000</span>
          </div>
        </div>
      </motion.div>

      {/* Trend indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex items-center justify-center gap-3 py-4 px-5 bg-success/10 rounded-xl"
      >
        <TrendingUp className="w-5 h-5 text-success" />
        <p className="text-sm text-success font-medium">
          Ahorraste un 15% más que el mes pasado
        </p>
      </motion.div>
    </div>
  );
};
