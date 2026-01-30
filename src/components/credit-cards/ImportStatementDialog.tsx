import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileText, CreditCard, Plus, X } from "lucide-react";
import { useStatementImport, ExtractedItem } from "@/hooks/useStatementImport";
import { format, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
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
  creditCards: CreditCardType[];
  onSuccess: () => void;
  onAddCard?: (card: { name: string; bank: string | null; closing_day: number | null }) => Promise<void>;
}

const MONTHS_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const date = subMonths(startOfMonth(new Date()), i);
  return {
    value: date.toISOString(),
    label: format(date, "MMMM yyyy", { locale: es }),
  };
});

export function ImportStatementDialog({
  open,
  onOpenChange,
  userId,
  creditCards,
  onSuccess,
  onAddCard,
}: ImportStatementDialogProps) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "add-card">("upload");
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS_OPTIONS[0].value);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newCardName, setNewCardName] = useState("");
  const [newCardBank, setNewCardBank] = useState("");
  const [addingCard, setAddingCard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploading,
    parsing,
    importing,
    extractedItems,
    uploadAndParse,
    toggleItemSelection,
    toggleAllSelection,
    importTransactions,
    reset,
  } = useStatementImport();

  const handleClose = () => {
    setStep("upload");
    setSelectedCardId("");
    setSelectedMonth(MONTHS_OPTIONS[0].value);
    setSelectedFile(null);
    setNewCardName("");
    setNewCardBank("");
    reset();
    onOpenChange(false);
  };

  const handleAddCard = async () => {
    if (!newCardName.trim()) {
      toast.error("Ingresa un nombre para la tarjeta");
      return;
    }
    if (!onAddCard) return;

    setAddingCard(true);
    try {
      await onAddCard({
        name: newCardName.trim(),
        bank: newCardBank.trim() || null,
        closing_day: null,
      });
      toast.success("Tarjeta agregada correctamente");
      setNewCardName("");
      setNewCardBank("");
      setStep("upload");
    } catch {
      // Error handled in hook
    } finally {
      setAddingCard(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleAnalyzeAndCheck = async () => {
    if (!selectedFile || !selectedCardId) return;

    const success = await uploadAndParse(
      selectedFile,
      userId,
      selectedCardId,
      new Date(selectedMonth)
    );

    if (success) setStep("preview");
  };

  const handleImport = async () => {
    setStep("importing");

    const cardName = selectedCard?.name || "Tarjeta";

    const success = await importTransactions(
      userId,
      selectedCardId,
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

  const selectedCount = extractedItems.filter((item) => item.selected).length;
  const totalARS = extractedItems
    .filter((item) => item.selected && item.moneda === "ARS")
    .reduce((sum, item) => sum + item.monto, 0);
  const totalUSD = extractedItems
    .filter((item) => item.selected && item.moneda === "USD")
    .reduce((sum, item) => sum + item.monto, 0);

  const selectedCard = creditCards.find((c) => c.id === selectedCardId);

  const stepDescriptions = {
    upload: "Subí el PDF de tu resumen para extraer los consumos automáticamente.",
    preview: "Revisá los consumos. Las categorías se asignarán automáticamente.",
    importing: "",
    "add-card": "Agregá una nueva tarjeta para continuar con la importación.",
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
      {step === "add-card" && onAddCard && (
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="newCardName">Nombre de la tarjeta *</Label>
            <Input
              id="newCardName"
              placeholder="Ej: VISA Oro"
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newCardBank">Banco (opcional)</Label>
            <Input
              id="newCardBank"
              placeholder="Ej: Galicia"
              value={newCardBank}
              onChange={(e) => setNewCardBank(e.target.value)}
              className="bg-muted border-border"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleAddCard}
              disabled={addingCard || !newCardName.trim()}
              className="flex-1"
            >
              {addingCard ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                "Agregar y Continuar"
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "upload" && (
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Tarjeta de crédito</Label>
            {creditCards.length === 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 text-muted-foreground text-sm">
                  <CreditCard className="h-4 w-4 shrink-0" />
                  <span>No tenés tarjetas registradas</span>
                </div>
                {onAddCard && (
                  <Button
                    variant="outline"
                    onClick={() => setStep("add-card")}
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar tarjeta
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná una tarjeta" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditCards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          {card.name} {card.bank && `(${card.bank})`}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {onAddCard && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("add-card")}
                    className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" />
                    Agregar otra tarjeta
                  </Button>
                )}
              </div>
            )}
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

          <Button
            onClick={handleAnalyzeAndCheck}
            disabled={!selectedFile || !selectedCardId || uploading || parsing}
            className="w-full"
          >
            {(uploading || parsing) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                {uploading ? "Subiendo..." : "Analizando..."}
              </>
            ) : (
              "Analizar resumen"
            )}
          </Button>
        </div>
      )}

      {step === "preview" && (
        <div className="flex-1 flex flex-col min-h-0 py-4 overflow-hidden">
          {/* Summary - responsive stack */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 p-4 bg-muted/50 rounded-xl shrink-0">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedCount === extractedItems.length}
                onCheckedChange={(checked) => toggleAllSelection(!!checked)}
              />
              <span className="text-sm font-medium">
                {selectedCount} de {extractedItems.length} seleccionados
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {totalARS > 0 && (
                <span>
                  Total ARS: <strong>${totalARS.toLocaleString("es-AR")}</strong>
                </span>
              )}
              {totalUSD > 0 && (
                <span>
                  Total USD: <strong>${totalUSD.toLocaleString("en-US")}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Tip */}
          <div className="mb-4 p-3 bg-primary/5 border border-primary/10 rounded-xl text-sm text-foreground shrink-0">
            <span className="font-medium">Las categorías se asignarán automáticamente</span> después de importar, basándose en tu historial.
          </div>

          {/* Items list - only this scrolls; buttons stay fixed below */}
          <div
            className="flex-1 min-h-[180px] overflow-y-auto overflow-x-hidden no-scrollbar -mx-1 px-1 -webkit-overflow-scrolling-touch"
          >
            <div className="space-y-2 pr-2">
              {extractedItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItemSelection(item.id)}
                />
              ))}
            </div>
          </div>

          {/* Actions - always visible at bottom */}
          <div className="flex gap-3 mt-4 pt-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
              Volver
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedCount === 0 || importing}
              className="flex-1"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                  Importando...
                </>
              ) : (
                `Importar ${selectedCount}`
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

interface ItemRowProps {
  item: ExtractedItem;
  onToggle: () => void;
}

function ItemRow({ item, onToggle }: ItemRowProps) {
  const getBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "consumo":
        return "default";
      case "cuota":
        return "secondary";
      case "impuesto":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        item.selected ? "bg-background border-border" : "bg-muted/50 border-transparent opacity-60"
      }`}
    >
      <Checkbox checked={item.selected} onCheckedChange={onToggle} className="shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium truncate">{item.descripcion}</span>
          <Badge variant={getBadgeVariant(item.tipo)} className="shrink-0 text-[10px]">
            {item.tipo}
          </Badge>
          {item.cuota_actual && item.total_cuotas && (
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {item.cuota_actual}/{item.total_cuotas}
            </Badge>
          )}
        </div>
        {item.fecha && (
          <span className="text-xs text-muted-foreground">{item.fecha}</span>
        )}
      </div>

      <div className="w-24 text-right font-mono text-sm shrink-0">
        <span className={item.moneda === "USD" ? "text-green-600 dark:text-green-500" : ""}>
          {item.moneda === "USD" ? "US$" : "$"}
          {item.monto.toLocaleString(item.moneda === "USD" ? "en-US" : "es-AR")}
        </span>
      </div>
    </div>
  );
}
