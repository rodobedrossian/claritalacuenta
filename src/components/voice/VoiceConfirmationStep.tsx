import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, RefreshCw, Sparkles, Pencil, TrendingUp, TrendingDown } from "lucide-react";
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
  onConfirmDirect: () => void; // Confirms and saves directly
  onEdit: () => void; // Opens wizard for editing
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
  onConfirmDirect,
  onEdit,
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

  // Auto-advance for high confidence - now calls onConfirmDirect
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
        onConfirmDirect(); // Direct save, not wizard
      }
    }, 50);

    return () => clearInterval(interval);
  }, [open, isHighConfidence, transaction, onConfirmDirect]);

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
      {/* Transaction Card */}
      <motion.div
        className="bg-muted/30 rounded-2xl p-5 mb-6 border border-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
        <div className="flex items-center gap-3">
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
                Guardando automáticamente...
              </p>
              <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  style={{ width: `${autoAdvanceProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Toca para cancelar y editar
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
        {/* Primary: Confirm and Save Directly */}
        <Button
          onClick={() => {
            handleInteraction();
            onConfirmDirect();
          }}
          className="w-full h-14 text-lg gap-2 gradient-primary shadow-lg"
          size="lg"
        >
          <Check className="h-5 w-5" />
          Confirmar
        </Button>

        {/* Secondary: Edit in Wizard */}
        <Button
          variant="outline"
          onClick={() => {
            handleInteraction();
            onEdit();
          }}
          className="w-full gap-2"
        >
          <Pencil className="h-4 w-4" />
          Editar detalles
        </Button>

        {/* Retry */}
        <Button
          variant="ghost"
          onClick={() => {
            handleInteraction();
            onRetry();
          }}
          className="w-full gap-2 text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Volver a grabar
        </Button>

        {/* Cancel - smaller, less prominent */}
        <button
          onClick={() => {
            handleInteraction();
            onCancel();
          }}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Cancelar
        </button>
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
