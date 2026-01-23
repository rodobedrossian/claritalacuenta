import { Plus, Mic, PiggyBank, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onAddExpense: () => void;
  onVoiceRecord: () => void;
  onTransferToSavings: () => void;
  isRecording: boolean;
  isProcessing: boolean;
}

export const QuickActions = ({
  onAddExpense,
  onVoiceRecord,
  onTransferToSavings,
  isRecording,
  isProcessing,
}: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Button
        onClick={onAddExpense}
        variant="outline"
        className="h-auto py-4 flex flex-col gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5"
      >
        <div className="p-2 rounded-full bg-primary/10">
          <Plus className="h-5 w-5 text-primary" />
        </div>
        <span className="text-xs font-medium">Agregar</span>
      </Button>

      <Button
        onClick={onVoiceRecord}
        disabled={isRecording || isProcessing}
        variant="outline"
        className="h-auto py-4 flex flex-col gap-2 border-border/50 hover:border-secondary/50 hover:bg-secondary/5"
      >
        <div className="p-2 rounded-full bg-secondary/10">
          {isProcessing ? (
            <Loader2 className="h-5 w-5 text-secondary animate-spin" />
          ) : (
            <Mic className={`h-5 w-5 text-secondary ${isRecording ? 'animate-pulse' : ''}`} />
          )}
        </div>
        <span className="text-xs font-medium">
          {isRecording ? "Grabando..." : isProcessing ? "Procesando" : "Por voz"}
        </span>
      </Button>

      <Button
        onClick={onTransferToSavings}
        variant="outline"
        className="h-auto py-4 flex flex-col gap-2 border-border/50 hover:border-success/50 hover:bg-success/5"
      >
        <div className="p-2 rounded-full bg-success/10">
          <PiggyBank className="h-5 w-5 text-success" />
        </div>
        <span className="text-xs font-medium">Ahorrar</span>
      </Button>
    </div>
  );
};
