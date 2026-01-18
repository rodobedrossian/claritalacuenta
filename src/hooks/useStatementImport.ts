import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExtractedItem {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  moneda: "ARS" | "USD";
  cuota_actual?: number | null;
  total_cuotas?: number | null;
  tipo: "consumo" | "cuota" | "impuesto";
  categoria: string;
  selected: boolean;
}

export interface ExtractedData {
  consumos: Array<{
    fecha: string;
    descripcion: string;
    monto: number;
    moneda: string;
    cuota_actual?: number | null;
    total_cuotas?: number | null;
  }>;
  cuotas: Array<{
    fecha: string;
    descripcion: string;
    monto: number;
    moneda: string;
    cuota_actual: number;
    total_cuotas: number;
  }>;
  impuestos: Array<{
    descripcion: string;
    monto: number;
    moneda: string;
  }>;
  resumen?: {
    total_ars?: number;
    total_usd?: number;
    fecha_vencimiento?: string;
    fecha_cierre?: string;
  };
}

interface StatementSummary {
  totalARS: number;
  totalUSD: number;
  fechaVencimiento: string | null;
  fechaCierre: string | null;
}

interface UseStatementImportReturn {
  uploading: boolean;
  parsing: boolean;
  importing: boolean;
  extractedItems: ExtractedItem[];
  statementImportId: string | null;
  statementSummary: StatementSummary | null;
  uploadAndParse: (file: File, userId: string, creditCardId: string, statementMonth: Date) => Promise<boolean>;
  toggleItemSelection: (id: string) => void;
  toggleAllSelection: (selected: boolean) => void;
  updateItemCategory: (id: string, category: string) => void;
  importTransactions: (userId: string, creditCardId: string, statementMonth: Date, cardName: string) => Promise<boolean>;
  reset: () => void;
}

// Category suggestions based on common patterns - normalized to match categories table
const suggestCategory = (descripcion: string, tipo: string): string => {
  const desc = descripcion.toUpperCase();
  
  if (tipo === "impuesto") return "Taxes";
  
  // Common Argentine merchants - using normalized category names that match the categories table
  if (desc.includes("MERCADOPAGO") || desc.includes("MERPAGO") || desc.includes("AMAZON")) return "Shopping";
  if (desc.includes("NETFLIX") || desc.includes("SPOTIFY") || desc.includes("DISNEY") || desc.includes("HBO") || desc.includes("APPLE.COM") || desc.includes("GOOGLE")) return "Subscriptions";
  if (desc.includes("UBER") || desc.includes("CABIFY") || desc.includes("DIDI")) return "Transportation";
  if (desc.includes("RAPPI") || desc.includes("PEDIDOSYA") || desc.includes("DELIVERY")) return "Dining";
  if (desc.includes("SUPERMERCADO") || desc.includes("JUMBO") || desc.includes("CARREFOUR") || desc.includes("DIA") || desc.includes("COTO")) return "Groceries";
  if (desc.includes("FARMACIA") || desc.includes("FARMACITY")) return "Healthcare";
  if (desc.includes("RESTAURANTE") || desc.includes("REST ") || desc.includes("CAFE") || desc.includes("BAR ")) return "Dining";
  if (desc.includes("MEGATLON") || desc.includes("SPORTCLUB") || desc.includes("GYM")) return "Fitness";
  if (desc.includes("HOTEL") || desc.includes("AIRBNB") || desc.includes("BOOKING")) return "Travel";
  if (desc.includes("COMBUSTIBLE") || desc.includes("YPF") || desc.includes("SHELL") || desc.includes("AXION")) return "Transportation";
  if (desc.includes("SEGURO")) return "Insurance";
  if (desc.includes("STEAM") || desc.includes("PLAYSTATION") || desc.includes("XBOX") || desc.includes("NINTENDO")) return "Entertainment";
  
  return "General";
};

export function useStatementImport(): UseStatementImportReturn {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [statementImportId, setStatementImportId] = useState<string | null>(null);
  const [statementSummary, setStatementSummary] = useState<StatementSummary | null>(null);

  const reset = useCallback(() => {
    setExtractedItems([]);
    setUploading(false);
    setParsing(false);
    setImporting(false);
    setStatementImportId(null);
    setStatementSummary(null);
  }, []);

  const uploadAndParse = useCallback(async (
    file: File,
    userId: string,
    creditCardId: string,
    statementMonth: Date
  ): Promise<boolean> => {
    try {
      setUploading(true);

      // Validate file
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Solo se permiten archivos PDF");
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande (máximo 10MB)");
        return false;
      }

      // Upload to storage
      const filePath = `${userId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("credit-card-statements")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Error al subir el archivo");
        return false;
      }

      // Create import record
      const { data: importRecord, error: insertError } = await supabase
        .from("statement_imports")
        .insert({
          user_id: userId,
          credit_card_id: creditCardId,
          file_path: filePath,
          file_name: file.name,
          statement_month: statementMonth.toISOString().split("T")[0],
          status: "processing",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        toast.error("Error al registrar la importación");
        return false;
      }

      // Store the import ID for later use
      setStatementImportId(importRecord.id);
      setUploading(false);
      setParsing(true);

      // Call edge function to parse
      const { data: parseResult, error: parseError } = await supabase.functions.invoke(
        "parse-credit-card-statement",
        {
          body: {
            file_path: filePath,
            statement_import_id: importRecord.id,
          },
        }
      );

      if (parseError || !parseResult?.success) {
        console.error("Parse error:", parseError || parseResult?.error);
        
        // Update import status to error
        await supabase
          .from("statement_imports")
          .update({ status: "error", error_message: parseResult?.error || "Parse failed" })
          .eq("id", importRecord.id);

        toast.error(parseResult?.error || "Error al procesar el PDF");
        return false;
      }

      const data: ExtractedData = parseResult.data;

      // Transform to unified items list
      const items: ExtractedItem[] = [];
      let idCounter = 0;

      // Add consumos
      data.consumos.forEach((c) => {
        items.push({
          id: `consumo_${idCounter++}`,
          fecha: c.fecha,
          descripcion: c.descripcion,
          monto: c.monto,
          moneda: (c.moneda as "ARS" | "USD") || "ARS",
          cuota_actual: c.cuota_actual,
          total_cuotas: c.total_cuotas,
          tipo: "consumo",
          categoria: suggestCategory(c.descripcion, "consumo"),
          selected: true,
        });
      });

      // Add cuotas
      data.cuotas.forEach((c) => {
        items.push({
          id: `cuota_${idCounter++}`,
          fecha: c.fecha,
          descripcion: c.descripcion,
          monto: c.monto,
          moneda: (c.moneda as "ARS" | "USD") || "ARS",
          cuota_actual: c.cuota_actual,
          total_cuotas: c.total_cuotas,
          tipo: "cuota",
          categoria: suggestCategory(c.descripcion, "cuota"),
          selected: true,
        });
      });

      // Add impuestos
      data.impuestos.forEach((i) => {
        items.push({
          id: `impuesto_${idCounter++}`,
          fecha: "",
          descripcion: i.descripcion,
          monto: i.monto,
          moneda: (i.moneda as "ARS" | "USD") || "ARS",
          cuota_actual: null,
          total_cuotas: null,
          tipo: "impuesto",
          categoria: "Impuestos",
          selected: true,
        });
      });

      setExtractedItems(items);
      
      // Store statement summary for payment transaction creation
      setStatementSummary({
        totalARS: data.resumen?.total_ars || 0,
        totalUSD: data.resumen?.total_usd || 0,
        fechaVencimiento: data.resumen?.fecha_vencimiento || null,
        fechaCierre: data.resumen?.fecha_cierre || null,
      });
      
      if (items.length === 0) {
        toast.warning("No se encontraron consumos en el PDF");
      } else {
        toast.success(`Se encontraron ${items.length} items`);
      }

      return true;
    } catch (error) {
      console.error("Upload and parse error:", error);
      toast.error("Error inesperado al procesar el archivo");
      return false;
    } finally {
      setUploading(false);
      setParsing(false);
    }
  }, []);

  const toggleItemSelection = useCallback((id: string) => {
    setExtractedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  }, []);

  const toggleAllSelection = useCallback((selected: boolean) => {
    setExtractedItems((prev) =>
      prev.map((item) => ({ ...item, selected }))
    );
  }, []);

  const updateItemCategory = useCallback((id: string, category: string) => {
    setExtractedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, categoria: category } : item
      )
    );
  }, []);

  const parseDate = (dateStr: string, statementMonth: Date): Date => {
    // Handle various date formats
    if (!dateStr) return statementMonth;
    
    // DD/MM/YYYY
    const fullMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (fullMatch) {
      return new Date(parseInt(fullMatch[3]), parseInt(fullMatch[2]) - 1, parseInt(fullMatch[1]));
    }
    
    // DD/MM
    const shortMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
    if (shortMatch) {
      const day = parseInt(shortMatch[1]);
      const month = parseInt(shortMatch[2]) - 1;
      const year = statementMonth.getFullYear();
      return new Date(year, month, day);
    }
    
    return statementMonth;
  };

  const parsePaymentDate = (dateStr: string | null, statementMonth: Date): Date => {
    if (!dateStr) {
      // Default to end of statement month if no due date
      const nextMonth = new Date(statementMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(10); // Default to 10th of next month
      return nextMonth;
    }
    
    // DD/MM/YYYY
    const fullMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (fullMatch) {
      return new Date(parseInt(fullMatch[3]), parseInt(fullMatch[2]) - 1, parseInt(fullMatch[1]));
    }
    
    // DD/MM
    const shortMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
    if (shortMatch) {
      const day = parseInt(shortMatch[1]);
      const month = parseInt(shortMatch[2]) - 1;
      // Use next year if the month is before statement month
      let year = statementMonth.getFullYear();
      if (month < statementMonth.getMonth()) {
        year++;
      }
      return new Date(year, month, day);
    }
    
    return statementMonth;
  };

  const importTransactions = useCallback(async (
    userId: string,
    creditCardId: string,
    statementMonth: Date,
    cardName: string
  ): Promise<boolean> => {
    try {
      setImporting(true);

      const selectedItems = extractedItems.filter((item) => item.selected);
      
      if (selectedItems.length === 0) {
        toast.error("No hay items seleccionados para importar");
        return false;
      }

      // 1. Insert consumption transactions into dedicated credit_card_transactions table
      const creditCardTransactions = selectedItems.map((item) => ({
        user_id: userId,
        statement_import_id: statementImportId,
        credit_card_id: creditCardId,
        description: item.descripcion,
        amount: Math.abs(item.monto),
        currency: item.moneda,
        category_id: item.categoria || null, // Now stores category UUID directly
        date: parseDate(item.fecha, statementMonth).toISOString().split("T")[0],
        transaction_type: item.tipo,
        installment_current: item.cuota_actual || null,
        installment_total: item.total_cuotas || null,
      }));

      const { error: ccInsertError } = await supabase
        .from("credit_card_transactions")
        .insert(creditCardTransactions);

      if (ccInsertError) {
        console.error("Insert credit card transactions error:", ccInsertError);
        toast.error("Error al crear las transacciones de tarjeta");
        return false;
      }

      // 2. Create payment transactions in main transactions table (impacts cashflow)
      const paymentDate = parsePaymentDate(statementSummary?.fechaVencimiento || null, statementMonth);
      const monthLabel = statementMonth.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

      // Calculate totals from selected items (or use statement summary if available)
      const selectedTotalARS = selectedItems
        .filter(item => item.moneda === "ARS")
        .reduce((sum, item) => sum + Math.abs(item.monto), 0);
      const selectedTotalUSD = selectedItems
        .filter(item => item.moneda === "USD")
        .reduce((sum, item) => sum + Math.abs(item.monto), 0);

      // Use statement summary totals if available, otherwise use selected items total
      const totalARS = statementSummary?.totalARS || selectedTotalARS;
      const totalUSD = statementSummary?.totalUSD || selectedTotalUSD;

      const paymentTransactions: Array<{
        user_id: string;
        type: string;
        amount: number;
        currency: string;
        category: string;
        description: string;
        date: string;
        payment_method: string;
        credit_card_id: string;
        source: string;
        status: string;
        statement_import_id: string | null;
      }> = [];

      if (totalARS > 0) {
        paymentTransactions.push({
          user_id: userId,
          type: "expense",
          amount: totalARS,
          currency: "ARS",
          category: "Credit Card Payment",
          description: `Pago tarjeta ${cardName} - ${monthLabel}`,
          date: paymentDate.toISOString(),
          payment_method: "debit",
          credit_card_id: creditCardId,
          source: "pdf_import",
          status: "confirmed",
          statement_import_id: statementImportId,
        });
      }

      if (totalUSD > 0) {
        paymentTransactions.push({
          user_id: userId,
          type: "expense",
          amount: totalUSD,
          currency: "USD",
          category: "Credit Card Payment",
          description: `Pago tarjeta ${cardName} (USD) - ${monthLabel}`,
          date: paymentDate.toISOString(),
          payment_method: "debit",
          credit_card_id: creditCardId,
          source: "pdf_import",
          status: "confirmed",
          statement_import_id: statementImportId,
        });
      }

      if (paymentTransactions.length > 0) {
        const { error: paymentInsertError } = await supabase
          .from("transactions")
          .insert(paymentTransactions);

        if (paymentInsertError) {
          console.error("Insert payment transactions error:", paymentInsertError);
          toast.error("Error al crear las transacciones de pago");
          return false;
        }
      }

      const paymentCount = paymentTransactions.length;
      toast.success(
        `Se importaron ${selectedItems.length} consumos y ${paymentCount} pago${paymentCount > 1 ? 's' : ''} de tarjeta`
      );
      return true;
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Error al importar las transacciones");
      return false;
    } finally {
      setImporting(false);
    }
  }, [extractedItems, statementImportId, statementSummary]);

  return {
    uploading,
    parsing,
    importing,
    extractedItems,
    statementImportId,
    statementSummary,
    uploadAndParse,
    toggleItemSelection,
    toggleAllSelection,
    updateItemCategory,
    importTransactions,
    reset,
  };
}
