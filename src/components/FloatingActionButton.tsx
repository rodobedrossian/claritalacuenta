import { useState } from "react";
import { Plus, PenLine, Mic, FileUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingActionButtonProps {
  onAddManual: () => void;
  onVoiceRecord: () => void;
  onImportStatement: () => void;
}

const actions = [
  { key: "import", icon: FileUp, label: "Importar resumen" },
  { key: "voice", icon: Mic, label: "Agregar gasto por voz" },
  { key: "manual", icon: PenLine, label: "Agregar gasto a mano" },
] as const;

export const FloatingActionButton = ({ onAddManual, onVoiceRecord, onImportStatement }: FloatingActionButtonProps) => {
  const [open, setOpen] = useState(false);

  const handleAction = (key: string) => {
    setOpen(false);
    if (key === "manual") onAddManual();
    else if (key === "voice") onVoiceRecord();
    else if (key === "import") onImportStatement();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB container */}
      <div className="fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px)+12px)] right-4 z-[70] md:bottom-6 md:right-6 flex flex-col items-end gap-3">
        {/* Action items */}
        <AnimatePresence>
          {open &&
            actions.map((action, i) => (
              <motion.button
                key={action.key}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ duration: 0.2, delay: (actions.length - 1 - i) * 0.05 }}
                onClick={() => handleAction(action.key)}
                className="flex items-center gap-3 active:scale-95 transition-transform"
              >
                <span className="bg-background text-foreground text-sm font-medium px-3 py-1.5 rounded-full shadow-lg border border-border/40">
                  {action.label}
                </span>
                <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                  <action.icon className="h-5 w-5 text-primary-foreground" />
                </div>
              </motion.button>
            ))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-stripe-lg transition-colors",
            open ? "bg-muted-foreground" : "gradient-primary",
          )}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {open ? <X className="h-7 w-7 text-background" /> : <Plus className="h-7 w-7 text-primary-foreground" />}
        </motion.button>
      </div>
    </>
  );
};
