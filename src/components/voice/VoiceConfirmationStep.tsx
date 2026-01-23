import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, RefreshCw, Sparkles, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoiceTransactionData } from "@/hooks/useVoiceTransaction";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCategoryIcon } from "@/lib/categoryIcons";

interface VoiceConfirmationStepProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: VoiceTransactionData | null;
  transcribedText: string;
  onConfirm: () => void;
  onRetry: () => void;
  onCancel: () => void;
}

const AUTO_ADVANCE_DELAY = 3000; // 3 seconds for high confidence
const HIGH_CONFIDENCE_THRESHOLD = 0.85;

export const VoiceConfirmationStep = ({
  open,
  onOpenChange,
  transaction,
  transcribedText,
  onConfirm,
  onRetry,
  onCancel,
}: VoiceConfirmationStepProps) => {
  const isMobile = useIsMobile();
  const [showCheck, setShowCheck] = useState(false);
  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
  const [autoAdvanceActive, setAutoAdvanceActive] = useState(false);

  const confidence = transaction?.confidence ?? 0;
  const isHighConfidence = confidence >= HIGH_CONFIDENCE_THRESHOLD;

  // Animate checkmark on mount
  useEffect(() => {
    if (open && transaction) {
      const timer = setTimeout(() => setShowCheck(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShowCheck(false);
    }
  }, [open, transaction]);

  // Auto-advance for high confidence
  useEffect(() => {
    if (!open || !isHighConfidence || !transaction) {
      setAutoAdvanceActive(false);
      setAutoAdvanceProgress(0);
      return;
    }

    setAutoAdvanceActive(true);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / AUTO_ADVANCE_DELAY) * 100, 100);
      setAutoAdvanceProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        onConfirm();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [open, isHighConfidence, transaction, onConfirm]);

  // Stop auto-advance on any interaction
  const handleInteraction = () => {
    setAutoAdvanceActive(false);
    setAutoAdvanceProgress(0);
  };

  if (!transaction) return null;

  const getConfidenceColor = () => {
    if (confidence >= 0.85) return "bg-green-500/20 text-green-500 border-green-500/30";
    if (confidence >= 0.6) return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    return "bg-red-500/20 text-red-500 border-red-500/30";
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.85) return "Alta confianza";
    if (confidence >= 0.6) return "Confianza media";
    return "Baja confianza";
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const CategoryIcon = getCategoryIcon(transaction.category);

  const content = (
    <div className="flex flex-col h-full px-6 py-8" onClick={handleInteraction}>
      {/* Success Animation */}
      <div className="flex justify-center mb-8">
        <motion.div
          className="relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Outer ring with sparkles */}
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-24 h-24 rounded-full bg-primary/10" />
          </motion.div>

          {/* Main circle */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <AnimatePresence>
              {showCheck && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Check className="h-12 w-12 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sparkle particles */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <motion.div
              key={angle}
              className="absolute"
              style={{
                top: `${50 + 60 * Math.sin((angle * Math.PI) / 180)}%`,
                left: `${50 + 60 * Math.cos((angle * Math.PI) / 180)}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                delay: 0.3 + i * 0.1,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Title */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold mb-2">¡Transacción detectada!</h2>
        <p className="text-sm text-muted-foreground">
          Revisa los datos extraídos de tu grabación
        </p>
      </motion.div>

      {/* Transaction Card */}
      <motion.div
        className="bg-muted/30 rounded-2xl p-5 mb-6 border border-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Amount & Type */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center",
              transaction.type === "expense" 
                ? "bg-destructive/10 text-destructive" 
                : "bg-green-500/10 text-green-500"
            )}>
              {transaction.type === "expense" ? (
                <TrendingDown className="h-6 w-6" />
              ) : (
                <TrendingUp className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {transaction.type === "expense" ? "Gasto" : "Ingreso"}
              </p>
              <p className={cn(
                "text-2xl font-bold",
                transaction.type === "expense" ? "text-destructive" : "text-green-500"
              )}>
                {transaction.type === "expense" ? "-" : "+"}
                {formatAmount(transaction.amount, transaction.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Category & Description */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CategoryIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{transaction.category}</p>
            {transaction.description && (
              <p className="text-sm text-muted-foreground truncate">
                {transaction.description}
              </p>
            )}
          </div>
        </div>

        {/* Transcribed text */}
        <div className="bg-background/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Texto reconocido:</p>
          <p className="text-sm italic">"{transcribedText}"</p>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center justify-between mt-4">
          <Badge variant="outline" className={cn("gap-1.5", getConfidenceColor())}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {getConfidenceLabel()} ({Math.round(confidence * 100)}%)
          </Badge>
          {transaction.notes && (
            <p className="text-xs text-muted-foreground">💡 {transaction.notes}</p>
          )}
        </div>
      </motion.div>

      {/* Auto-advance indicator */}
      <AnimatePresence>
        {autoAdvanceActive && isHighConfidence && (
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <p className="text-sm text-primary mb-2">
                Confirmando automáticamente...
              </p>
              <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  style={{ width: `${autoAdvanceProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Toca para editar manualmente
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <motion.div
        className="space-y-3 mt-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={() => {
            handleInteraction();
            onConfirm();
          }}
          className="w-full h-14 text-lg gap-2 gradient-primary shadow-lg"
          size="lg"
        >
          Confirmar y Editar
          <ArrowRight className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            handleInteraction();
            onRetry();
          }}
          className="w-full gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Volver a grabar
        </Button>

        <Button
          variant="ghost"
          onClick={() => {
            handleInteraction();
            onCancel();
          }}
          className="w-full text-muted-foreground"
        >
          Cancelar
        </Button>
      </motion.div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh]">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        {content}
      </DialogContent>
    </Dialog>
  );
};
