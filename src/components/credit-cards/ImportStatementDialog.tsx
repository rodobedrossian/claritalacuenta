import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, FileText, CreditCard, Check, X } from "lucide-react";
import { useStatementImport, ExtractedItem } from "@/hooks/useStatementImport";
import { format, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface CreditCard {
  id: string;
  name: string;
  bank?: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface ImportStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  creditCards: CreditCard[];
  categories: Category[];
  onSuccess: () => void;
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
  categories,
  onSuccess,
}: ImportStatementDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "importing">("upload");
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS_OPTIONS[0].value);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploading,
    parsing,
    importing,
    extractedItems,
    uploadAndParse,
    toggleItemSelection,
    toggleAllSelection,
    updateItemCategory,
    importTransactions,
    reset,
  } = useStatementImport();

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
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !selectedCardId) return;

    const success = await uploadAndParse(
      selectedFile,
      userId,
      selectedCardId,
      new Date(selectedMonth)
    );

    if (success && extractedItems.length > 0) {
      setStep("preview");
    }
  };

  // Wait for extractedItems to be populated after parsing
  const handleAnalyzeAndCheck = async () => {
    if (!selectedFile || !selectedCardId) return;

    const success = await uploadAndParse(
      selectedFile,
      userId,
      selectedCardId,
      new Date(selectedMonth)
    );

    if (success) {
      setStep("preview");
    }
  };

  const handleImport = async () => {
    setStep("importing");
    
    const success = await importTransactions(
      userId,
      selectedCardId,
      new Date(selectedMonth)
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importar Resumen de Tarjeta
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Subí el PDF de tu resumen de tarjeta para extraer los consumos automáticamente"}
            {step === "preview" && "Revisá los consumos extraídos y seleccioná cuáles importar"}
            {step === "importing" && "Importando transacciones..."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Tarjeta de Crédito</Label>
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
            </div>

            <div className="space-y-2">
              <Label>Mes del Resumen</Label>
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
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
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
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-10 w-10" />
                    <span>Hacé clic para seleccionar un PDF</span>
                    <span className="text-sm">o arrastralo aquí</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleAnalyzeAndCheck}
              disabled={!selectedFile || !selectedCardId || uploading || parsing}
              className="w-full"
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {parsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? "Subiendo..." : parsing ? "Analizando PDF..." : "Analizar Resumen"}
            </Button>
          </div>
        )}

        {step === "preview" && (
          <div className="flex-1 flex flex-col min-h-0 py-4">
            {/* Summary bar */}
            <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCount === extractedItems.length}
                    onCheckedChange={(checked) => toggleAllSelection(!!checked)}
                  />
                  <span className="text-sm font-medium">
                    {selectedCount} de {extractedItems.length} seleccionados
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
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

            {/* Items list */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2">
                {extractedItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    categories={categories}
                    onToggle={() => toggleItemSelection(item.id)}
                    onCategoryChange={(cat) => updateItemCategory(item.id, cat)}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex gap-3 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
                Volver
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedCount === 0 || importing}
                className="flex-1"
              >
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar {selectedCount} transacciones
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Importando transacciones...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ItemRowProps {
  item: ExtractedItem;
  categories: Category[];
  onToggle: () => void;
  onCategoryChange: (category: string) => void;
}

function ItemRow({ item, categories, onToggle, onCategoryChange }: ItemRowProps) {
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
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        item.selected ? "bg-background border-border" : "bg-muted/50 border-transparent opacity-60"
      }`}
    >
      <Checkbox checked={item.selected} onCheckedChange={onToggle} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{item.descripcion}</span>
          <Badge variant={getBadgeVariant(item.tipo)} className="shrink-0">
            {item.tipo}
          </Badge>
          {item.cuota_actual && item.total_cuotas && (
            <Badge variant="outline" className="shrink-0">
              {item.cuota_actual}/{item.total_cuotas}
            </Badge>
          )}
        </div>
        {item.fecha && (
          <span className="text-sm text-muted-foreground">{item.fecha}</span>
        )}
      </div>

      <Select value={item.categoria} onValueChange={onCategoryChange} disabled={!item.selected}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.name}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="w-28 text-right font-mono">
        <span className={item.moneda === "USD" ? "text-green-600" : ""}>
          {item.moneda === "USD" ? "US$" : "$"}
          {item.monto.toLocaleString(item.moneda === "USD" ? "en-US" : "es-AR")}
        </span>
      </div>
    </div>
  );
}
