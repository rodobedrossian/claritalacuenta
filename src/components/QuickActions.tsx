import { Plus, Mic, PiggyBank, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface QuickActionsProps {
  onAddExpense: () => void;
  onVoiceRecord: () => void;
  onTransferToSavings: () => void;
  isRecording: boolean;
  isProcessing: boolean;
}

const buttonVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      delay: 0.3 + i * 0.08,
      ease: "easeOut" as const
    }
  })
};

export const QuickActions = ({
  onAddExpense,
  onVoiceRecord,
  onTransferToSavings,
  isRecording,
  isProcessing,
}: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <motion.div
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <Button
          onClick={onAddExpense}
          variant="outline"
          className="w-full h-auto py-3 flex flex-col gap-2 border-border hover:border-primary/50 hover:bg-primary/5"
        >
          <div className="p-2 rounded-full bg-primary/10">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-medium">Agregar</span>
        </Button>
      </motion.div>

      <motion.div
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <Button
          onClick={onVoiceRecord}
          disabled={isRecording || isProcessing}
          variant="outline"
          className="w-full h-auto py-3 flex flex-col gap-2 border-border hover:border-primary/50 hover:bg-primary/5"
        >
          <div className="p-2 rounded-full bg-primary/10">
            {isProcessing ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            ) : (
              <Mic className={`h-5 w-5 text-primary ${isRecording ? 'animate-pulse' : ''}`} />
            )}
          </div>
          <span className="text-xs font-medium">
            {isRecording ? "Grabando..." : isProcessing ? "Procesando" : "Por voz"}
          </span>
        </Button>
      </motion.div>

      <motion.div
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        custom={2}
      >
        <Button
          onClick={onTransferToSavings}
          variant="outline"
          className="w-full h-auto py-3 flex flex-col gap-2 border-border hover:border-success/50 hover:bg-success/5"
        >
          <div className="p-2 rounded-full bg-success/10">
            <PiggyBank className="h-5 w-5 text-success" />
          </div>
          <span className="text-xs font-medium">Ahorrar</span>
        </Button>
      </motion.div>
    </div>
  );
};
