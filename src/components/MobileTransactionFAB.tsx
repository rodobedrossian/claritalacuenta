import { useState, useEffect } from "react";
import { Plus, Mic, FileUp, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileTransactionFABProps {
  onAddManual?: () => void;
  onVoiceRecord?: () => void;
  onImportStatement?: () => void;
  isRecording?: boolean;
  isProcessing?: boolean;
  showImport?: boolean;
}

export const MobileTransactionFAB = ({
  onAddManual,
  onVoiceRecord,
  onImportStatement,
  isRecording = false,
  isProcessing = false,
  showImport = true,
}: MobileTransactionFABProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hasCreditCards, setHasCreditCards] = useState(false);

  // Check if user has credit cards for import option
  useEffect(() => {
    const checkCreditCards = async () => {
      const { data } = await supabase
        .from("credit_cards")
        .select("id")
        .limit(1);
      setHasCreditCards((data?.length || 0) > 0);
    };
    checkCreditCards();
  }, []);

  if (!isMobile) return null;

  const handleAddManual = () => {
    setIsOpen(false);
    if (onAddManual) {
      onAddManual();
    } else {
      // Navigate to dashboard if no handler (dialog will be triggered there)
      navigate("/?action=add-transaction");
    }
  };

  const handleVoiceRecord = () => {
    setIsOpen(false);
    if (onVoiceRecord) {
      onVoiceRecord();
    } else {
      navigate("/?action=voice-record");
    }
  };

  const handleImportStatement = () => {
    setIsOpen(false);
    if (onImportStatement) {
      onImportStatement();
    } else {
      navigate("/credit-cards?action=import");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            size="lg" 
            className="h-14 w-14 rounded-full shadow-lg gradient-primary hover:opacity-90 transition-all"
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          side="top" 
          className="w-64 mb-2"
        >
          <DropdownMenuItem 
            onClick={handleAddManual}
            className="cursor-pointer py-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar transacción a mano
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleVoiceRecord}
            disabled={isRecording || isProcessing}
            className="cursor-pointer py-3"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mic className="h-4 w-4 mr-2" />
            )}
            {isRecording ? "Grabando..." : isProcessing ? "Procesando..." : "Grabar por voz / Dictar transacción"}
          </DropdownMenuItem>
          {(showImport || hasCreditCards) && (
            <DropdownMenuItem 
              onClick={handleImportStatement}
              className="cursor-pointer py-3"
            >
              <FileUp className="h-4 w-4 mr-2" />
              Importar resumen de cuenta
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
