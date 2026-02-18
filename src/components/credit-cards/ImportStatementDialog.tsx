import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, FileText, CreditCard, X, Sparkles, Info, Calendar, Receipt, DollarSign } from "lucide-react";
import { useStatementImport } from "@/hooks/useStatementImport";
import { format, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

interface CreditCardType {
  id: string;
  name: string;
  bank?: string;
}

interface ImportStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  workspaceId: string | null;
  creditCards: CreditCardType[];
  onSuccess: () => void;
}

const MONTHS_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const date = subMonths(startOfMonth(new Date()), i);
  return {
    value: date.toISOString(),
    label: format(date, "MMMM yyyy", { locale: es }),
  };
});

const PROGRESS_MESSAGES = [
  "Subiendo archivo...",
  "Analizando estructura del PDF...",
  "Identificando consumos y cuotas...",
  "Extrayendo montos e impuestos...",
  "Validando totales...",
  "Casi listo...",
];

export function ImportStatementDialog({
  open,
  onOpenChange,
  userId,
  workspaceId,
  creditCards,
  onSuccess,
}: ImportStatementDialogProps) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<"upload" | "preview" | "importing">("upload");
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS_OPTIONS[0].value);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progressIndex, setProgressIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploading,
    parsing,
    importing,
    extractedItems,
    statementSummary,
    detectedCard,
    resolvedCardId,
    uploadAndParse,
    importTransactions,
    reset,
  } = useStatementImport(workspaceId);

  // Rotate progress messages every 15 seconds during processing
  useEffect(() => {
    if (uploading || parsing) {
      setProgressIndex(0);
      const interval = setInterval(() => {
        setProgressIndex((prev) =>
          prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev
        );
      }, 15000);
      return () => clearInterval(interval);
    } else {
      setProgressIndex(0);
    }
  }, [uploading, parsing]);

  const handleClose = () => {
    setStep("upload");
    setSelectedCardId("");
    setSelectedMonth(MONTHS_OPTIONS[0].value);
    setSelectedFile(null);
    reset();
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleAnalyzeAndCheck = async () => {
    if (!selectedFile) return;

    const success = await uploadAndParse(
      selectedFile,
      userId,
      new Date(selectedMonth),
      selectedCardId || undefined
    );

    if (success) setStep("preview");
  };

  const handleImport = async () => {
    const finalCardId = resolvedCardId || selectedCardId;
    if (!finalCardId) return;

    setStep("importing");

    const cardName = detectedCard?.name || selectedCard?.name || "Tarjeta";

    const success = await importTransactions(
      userId,
      finalCardId,
      new Date(selectedMonth),
      cardName
    );

    if (success) {
      onSuccess();
      handleClose();
    } else {
      setStep("preview");
    }
  };

  const totalCount = extractedItems.length;
  const totalARS = statementSummary?.totalARS || extractedItems
    .filter((item) => item.moneda === "ARS")
    .reduce((sum, item) => sum + item.monto, 0);
  const totalUSD = statementSummary?.totalUSD || extractedItems
    .filter((item) => item.moneda === "USD")
    .reduce((sum, item) => sum + item.monto, 0);

  const selectedCard = creditCards.find((c) => c.id === selectedCardId);

  const fechaVencimiento = statementSummary?.fechaVencimiento || null;
  const fechaCierre = statementSummary?.fechaCierre || null;

  const stepDescriptions: Record<string, string> = {
    upload: "Subí el PDF y la tarjeta se detecta automáticamente.",
    preview: "Resumen del archivo procesado.",
    importing: "",
  };

  const Header = (
    <>
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 shrink-0" />
        <span>Importar Resumen de Tarjeta</span>
      </div>
      {stepDescriptions[step] && (
        <p className="text-sm text-muted-foreground break-words whitespace-normal min-w-0 mt-1">
          {stepDescriptions[step]}
        </p>
      )}
    </>
  );

  const Content = (
    <>
      {step === "upload" && (
        <div className="space-y-6 py-4">
          {(uploading || parsing) ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <Sparkles className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <div className="w-full max-w-xs space-y-4">
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="h-full w-2/5 bg-primary animate-progress-indeterminate" />
                </div>
                <p className="text-sm font-medium text-center">
                  {PROGRESS_MESSAGES[progressIndex]}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Archivo PDF</Label>
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 md:p-8 text-center hover:border-primary/50 transition-colors cursor-pointer active:bg-muted/30"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-10 w-10 text-primary" />
                      <span className="font-medium truncate max-w-full px-2">{selectedFile.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-10 w-10" />
                      <span className="text-sm">Tocá para seleccionar un PDF</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mes del resumen</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {creditCards.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">
                    Tarjeta (opcional — se detecta automáticamente del PDF)
                  </Label>
                  <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Detección automática" />
                    </SelectTrigger>
                    <SelectContent>
                      {creditCards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5" />
                            {card.name} {card.bank && `(${card.bank})`}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 inline mr-1.5 text-primary" />
                La tarjeta, banco y red se detectan automáticamente del resumen.
              </div>

              <Button
                onClick={handleAnalyzeAndCheck}
                disabled={!selectedFile}
                className="w-full"
              >
                Analizar resumen
              </Button>
            </>
          )}
        </div>
      )}

      {step === "preview" && (
        <div className="flex-1 flex flex-col min-h-0 py-4 overflow-auto">
          {/* Detected card banner OR fallback card picker */}
          {detectedCard ? (
            <div className="mb-4 p-3 bg-muted/50 rounded-xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{detectedCard.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[detectedCard.card_network, detectedCard.bank, detectedCard.account_number ? `Cuenta ${detectedCard.account_number}` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {detectedCard.is_new && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">Nueva</Badge>
                )}
              </div>
            </div>
          ) : !resolvedCardId && !selectedCardId && creditCards.length > 0 ? (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl shrink-0 space-y-2">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                No se pudo detectar la tarjeta automáticamente. Seleccioná una:
              </p>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Seleccioná una tarjeta" />
                </SelectTrigger>
                <SelectContent>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5" />
                        {card.name} {card.bank && `(${card.bank})`}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
            <div className="p-4 bg-muted/50 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Receipt className="h-3.5 w-3.5" />
                <span className="text-xs">Transacciones</span>
              </div>
              <p className="text-xl font-semibold">{totalCount}</p>
            </div>
            {totalARS > 0 && (
              <div className="p-4 bg-muted/50 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-xs">Total ARS</span>
                </div>
                <p className="text-xl font-semibold">${totalARS.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</p>
              </div>
            )}
            {totalUSD > 0 && (
              <div className="p-4 bg-muted/50 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-xs">Total USD</span>
                </div>
                <p className="text-xl font-semibold">U$D {totalUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
              </div>
            )}
            {(fechaVencimiento || fechaCierre) && (
              <div className="p-4 bg-muted/50 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-xs">Fechas</span>
                </div>
                <div className="text-sm space-y-0.5">
                  {fechaCierre && <p>Cierre: <strong>{fechaCierre}</strong></p>}
                  {fechaVencimiento && <p>Vto: <strong>{fechaVencimiento}</strong></p>}
                </div>
              </div>
            )}
          </div>

          {/* Auto-categorization tip */}
          <div className="mb-4 p-3 bg-primary/5 border border-primary/10 rounded-xl text-sm text-foreground shrink-0">
            <Sparkles className="h-4 w-4 inline mr-1.5 text-primary" />
            <span className="font-medium">Las categorías se asignarán automáticamente</span> después de importar, basándose en tu historial.
          </div>

          {/* Payment transaction info */}
          <div className="mb-4 p-3 bg-muted/50 border border-border rounded-xl text-sm text-muted-foreground shrink-0">
            <Info className="h-4 w-4 inline mr-1.5 text-muted-foreground" />
            Se generará automáticamente una transacción de pago de tarjeta en la fecha de vencimiento del resumen{fechaVencimiento ? ` (${fechaVencimiento})` : ""}, reflejando el impacto en tu flujo de caja.
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-auto pt-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
              Volver
            </Button>
            <Button
              onClick={handleImport}
              disabled={totalCount === 0 || importing || (!resolvedCardId && !selectedCardId)}
              className="flex-1"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                  Importando...
                </>
              ) : (
                `Importar ${totalCount} transacciones`
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "importing" && (
        <div className="py-20 flex flex-col items-center justify-center gap-5">
          <Loader2 className="h-10 w-10 animate-spin text-primary" strokeWidth={2} />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">Importando transacciones</p>
            <p className="text-xs text-muted-foreground">Un momento...</p>
          </div>
        </div>
      )}
    </>
  );

  if (isMobile) {
    const isPreviewStep = step === "preview";
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[92vh] flex flex-col pb-safe">
          <div className="px-4 pt-2 pb-4 flex flex-col flex-1 min-h-0 overflow-hidden">
            <DrawerHeader className="px-0 text-left shrink-0 relative pr-10">
              <DrawerTitle className="text-left pr-0">{Header}</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-9 w-9 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <div
              className={`flex-1 min-h-0 flex flex-col ${
                isPreviewStep ? "overflow-hidden" : "overflow-y-auto no-scrollbar"
              }`}
            >
              {Content}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex flex-col text-left">{Header}</DialogTitle>
        </DialogHeader>
        <div className={step === "preview" ? "flex-1 min-h-0 flex flex-col overflow-hidden" : "overflow-y-auto"}>
          {Content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
