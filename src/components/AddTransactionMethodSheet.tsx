import { PenLine, Mic } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface AddTransactionMethodSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectManual: () => void;
  onSelectVoice: () => void;
}

/**
 * iOS-style action sheet: choose how to add a transaction (manual or voice).
 * Mobile-first, shown when the user taps the "+" FAB from any screen.
 */
export const AddTransactionMethodSheet = ({
  open,
  onOpenChange,
  onSelectManual,
  onSelectVoice,
}: AddTransactionMethodSheetProps) => {
  const handleManual = () => {
    onOpenChange(false);
    onSelectManual();
  };

  const handleVoice = () => {
    onOpenChange(false);
    onSelectVoice();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="safe-area-bottom pb-6">
        <DrawerHeader className="text-center pb-1 pt-2">
          <DrawerTitle className="text-base font-semibold text-foreground">
            ¿Cómo querés agregar?
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-2">
          <button
            type="button"
            onClick={handleManual}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-primary text-primary-foreground py-4 px-4 font-semibold text-base active:opacity-90 transition-opacity"
          >
            <PenLine className="h-5 w-5 shrink-0" />
            Agregar manual
          </button>
          <button
            type="button"
            onClick={handleVoice}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-primary/10 text-primary border border-primary/30 py-4 px-4 font-semibold text-base active:opacity-90 transition-opacity"
          >
            <Mic className="h-5 w-5 shrink-0" />
            Por voz
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl py-4 px-4 font-semibold text-base text-muted-foreground hover:bg-muted active:bg-muted/80 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
