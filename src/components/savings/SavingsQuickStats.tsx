import { Wallet, TrendingUp, PiggyBank, Target } from "lucide-react";
import { motion } from "framer-motion";

interface SavingsQuickStatsProps {
  currentSavings: { usd: number; ars: number };
  totalInvested: { usd: number; ars: number };
  patrimonioARS: number;
  exchangeRate: number;
  activeGoals: number;
  completedGoals: number;
  formatCurrency: (amount: number, currency: "USD" | "ARS") => string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: i * 0.1,
      ease: "easeOut" as const
    }
  })
};

export const SavingsQuickStats = ({
  currentSavings,
  totalInvested,
  patrimonioARS,
  exchangeRate,
  activeGoals,
  completedGoals,
  formatCurrency,
}: SavingsQuickStatsProps) => {
  return (
    <div className="space-y-3">
      {/* Ahorros Líquidos */}
      <motion.div 
        className="bg-card rounded-xl p-4 border border-border/50"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ahorros Líquidos</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(currentSavings.usd, "USD")}
              </p>
            </div>
          </div>
          <div className="text-right">
            {currentSavings.ars > 0 && (
              <p className="text-xs text-muted-foreground">
                + {formatCurrency(currentSavings.ars, "ARS")}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Total Invertido */}
      <motion.div 
        className="bg-card rounded-xl p-4 border border-border/50"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Invertido</p>
              <p className="text-lg font-bold text-success">
                {formatCurrency(totalInvested.usd, "USD")}
              </p>
            </div>
          </div>
          <div className="text-right">
            {totalInvested.ars > 0 && (
              <p className="text-xs text-muted-foreground">
                + {formatCurrency(totalInvested.ars, "ARS")}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Patrimonio Total */}
      <motion.div 
        className="bg-card rounded-xl p-4 border border-border/50"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={2}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <PiggyBank className="h-4 w-4 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Patrimonio Total</p>
              <p className="text-lg font-bold text-secondary">
                {formatCurrency(patrimonioARS, "ARS")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              TC: {exchangeRate.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Objetivos */}
      <motion.div 
        className="bg-card rounded-xl p-4 border border-border/50"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={3}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/50">
              <Target className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Objetivos Activos</p>
              <p className="text-lg font-bold">
                {activeGoals}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {completedGoals} completados
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
