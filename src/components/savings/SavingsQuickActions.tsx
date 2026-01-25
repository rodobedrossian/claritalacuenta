import { Plus, TrendingUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface SavingsQuickActionsProps {
  onAddSavings: () => void;
  onAddInvestment: () => void;
  onAddGoal: () => void;
}

const buttonVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      delay: 0.4 + i * 0.08,
      ease: "easeOut" as const
    }
  })
};

export const SavingsQuickActions = ({
  onAddSavings,
  onAddInvestment,
  onAddGoal,
}: SavingsQuickActionsProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <motion.div
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <Button
          onClick={onAddSavings}
          variant="outline"
          className="w-full h-auto py-4 flex flex-col gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5"
        >
          <div className="p-2 rounded-full bg-primary/10">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-medium">Ahorro</span>
        </Button>
      </motion.div>

      <motion.div
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <Button
          onClick={onAddInvestment}
          variant="outline"
          className="w-full h-auto py-4 flex flex-col gap-2 border-border/50 hover:border-success/50 hover:bg-success/5"
        >
          <div className="p-2 rounded-full bg-success/10">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <span className="text-xs font-medium">Inversión</span>
        </Button>
      </motion.div>

      <motion.div
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        custom={2}
      >
        <Button
          onClick={onAddGoal}
          variant="outline"
          className="w-full h-auto py-4 flex flex-col gap-2 border-border/50 hover:border-secondary/50 hover:bg-secondary/5"
        >
          <div className="p-2 rounded-full bg-secondary/10">
            <Target className="h-5 w-5 text-secondary" />
          </div>
          <span className="text-xs font-medium">Objetivo</span>
        </Button>
      </motion.div>
    </div>
  );
};
