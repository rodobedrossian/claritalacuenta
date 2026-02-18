import { Plus, Mic, PiggyBank, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface QuickActionsProps {
  onAddExpense: () => void;
  onVoiceRecord: () => void;
  onTransferToSavings: () => void;
  isRecording: boolean;
  isProcessing: boolean;
}

const actions = [
  { key: "add", icon: Plus, label: "Agregar", variant: "primary" as const },
  { key: "voice", icon: Mic, label: "Por voz", variant: "primary" as const },
  { key: "save", icon: PiggyBank, label: "Ahorrar", variant: "success" as const },
];

const buttonVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      delay: 0.15 + i * 0.06,
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
  const handlers = [onAddExpense, onVoiceRecord, onTransferToSavings];

  return (
    <div className="flex items-center justify-center gap-8 py-2">
      {actions.map((action, i) => {
        const Icon = action.icon;
        const isVoice = action.key === "voice";
        const disabled = isVoice && (isRecording || isProcessing);
        const bgClass = action.variant === "success" ? "bg-success/10" : "bg-primary/10";
        const iconClass = action.variant === "success" ? "text-success" : "text-primary";

        return (
          <motion.button
            key={action.key}
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            custom={i}
            whileTap={{ scale: 0.9 }}
            onClick={handlers[i]}
            disabled={disabled}
            className="flex flex-col items-center gap-1.5 disabled:opacity-50"
          >
            <div className={`w-14 h-14 rounded-full ${bgClass} flex items-center justify-center shadow-sm active:shadow-none transition-shadow`}>
              {isVoice && isProcessing ? (
                <Loader2 className={`h-6 w-6 ${iconClass} animate-spin`} />
              ) : (
                <Icon className={`h-6 w-6 ${iconClass} ${isVoice && isRecording ? 'animate-pulse' : ''}`} />
              )}
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {isVoice && isRecording ? "Grabando" : isVoice && isProcessing ? "..." : action.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
