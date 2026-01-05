import { useState } from "react";
import { Plus, Mic, FileUp, PenLine, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface TransactionActionsDropdownProps {
  onAddManual: () => void;
  onVoiceRecord: () => void;
  onImportStatement: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  showImport: boolean;
}

export const TransactionActionsDropdown = ({
  onAddManual,
  onVoiceRecord,
  onImportStatement,
  isRecording,
  isProcessing,
  showImport,
}: TransactionActionsDropdownProps) => {
  const [open, setOpen] = useState(false);

  const handleVoiceClick = () => {
    setOpen(false);
    onVoiceRecord();
  };

  const handleManualClick = () => {
    setOpen(false);
    onAddManual();
  };

  const handleImportClick = () => {
    setOpen(false);
    onImportStatement();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="gradient-primary gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Transacción</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
        <DropdownMenuItem 
          onClick={handleManualClick}
          className="cursor-pointer gap-3 py-3"
        >
          <PenLine className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span>Agregar manualmente</span>
            <span className="text-xs text-muted-foreground">Completar formulario</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleVoiceClick}
          disabled={isRecording || isProcessing}
          className="cursor-pointer gap-3 py-3"
        >
          <Mic className={`h-4 w-4 ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
          <div className="flex flex-col">
            <span>{isRecording ? 'Grabando...' : isProcessing ? 'Procesando...' : 'Grabar por voz'}</span>
            <span className="text-xs text-muted-foreground">
              {isRecording ? 'Toca para detener' : 'Dictar transacción'}
            </span>
          </div>
        </DropdownMenuItem>

        {showImport && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleImportClick}
              className="cursor-pointer gap-3 py-3"
            >
              <FileUp className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>Importar resumen</span>
                <span className="text-xs text-muted-foreground">Desde PDF de tarjeta</span>
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
