import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sanitizeFilename } from "@/lib/utils";

export interface ExtractedItem {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  moneda: "ARS" | "USD";
  cuota_actual?: number | null;
  total_cuotas?: number | null;
  tipo: "consumo" | "cuota" | "impuesto" | "ajuste";
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
  ajustes?: Array<{
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
  conciliacion?: {
    total_consumos_ars: number;
    total_impuestos_ars: number;
    total_ajustes_ars: number;
    total_calculado_ars: number;
    total_resumen_ars: number;
    diferencia_ars: number;
    estado_ars: string;
    total_consumos_usd: number;
    total_impuestos_usd: number;
    total_ajustes_usd: number;
    total_calculado_usd: number;
    total_resumen_usd: number;
    diferencia_usd: number;
    estado_usd: string;
  };
}

export interface Conciliacion {
  totalConsumosARS: number;
  totalImpuestosARS: number;
  totalAjustesARS: number;
  totalCalculadoARS: number;
  totalResumenARS: number;
  diferenciaARS: number;
  estadoARS: string;
  totalConsumosUSD: number;
  totalImpuestosUSD: number;
  totalAjustesUSD: number;
  totalCalculadoUSD: number;
  totalResumenUSD: number;
  diferenciaUSD: number;
  estadoUSD: string;
}

interface StatementSummary {
  totalARS: number;
  totalUSD: number;
  fechaVencimiento: string | null;
  fechaCierre: string | null;
  conciliacion: Conciliacion | null;
}

export interface DetectedCard {
  id: string;
  name: string;
  bank: string | null;
  card_network: string | null;
  account_number: string | null;
  closing_day: number | null;
  is_new: boolean;
}

interface UseStatementImportReturn {
  uploading: boolean;
  parsing: boolean;
  importing: boolean;
  extractedItems: ExtractedItem[];
  statementImportId: string | null;
  statementSummary: StatementSummary | null;
  detectedCard: DetectedCard | null;
  resolvedCardId: string | null;
  uploadAndParse: (file: File, userId: string, statementMonth: Date, creditCardId?: string) => Promise<boolean>;
  toggleItemSelection: (id: string) => void;
  toggleAllSelection: (selected: boolean) => void;
  importTransactions: (userId: string, creditCardId: string, statementMonth: Date, cardName: string) => Promise<boolean>;
  reset: () => void;
}

export function useStatementImport(workspaceId: string | null): UseStatementImportReturn {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [statementImportId, setStatementImportId] = useState<string | null>(null);
  const [statementSummary, setStatementSummary] = useState<StatementSummary | null>(null);
  const [detectedCard, setDetectedCard] = useState<DetectedCard | null>(null);
  const [resolvedCardId, setResolvedCardId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setExtractedItems([]);
    setUploading(false);
    setParsing(false);
    setImporting(false);
    setStatementImportId(null);
    setStatementSummary(null);
    setDetectedCard(null);
    setResolvedCardId(null);
  }, []);

  const uploadAndParse = useCallback(async (
    file: File,
    userId: string,
    statementMonth: Date,
    creditCardId?: string
  ): Promise<boolean> => {
    if (!workspaceId) {
      toast.error("No se pudo determinar el espacio de trabajo");
      return false;
    }
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

      // Upload to storage with sanitized filename to avoid InvalidKey errors
      const safeFilename = sanitizeFilename(file.name);
      const filePath = `${userId}/${Date.now()}_${safeFilename}`;
      const { error: uploadError } = await supabase.storage
        .from("credit-card-statements")
        .upload(filePath, file, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        const errorMessage = (uploadError as any)?.error === "InvalidKey"
          ? "El nombre del archivo contiene caracteres no válidos"
          : "Error al subir el archivo";
        toast.error(errorMessage);
        return false;
      }

      // Create import record (credit_card_id may be null - will be resolved by edge function)
      const importPayload: Record<string, unknown> = {
        user_id: userId,
        workspace_id: workspaceId,
        file_path: filePath,
        file_name: file.name,
        statement_month: statementMonth.toISOString().split("T")[0],
        status: "processing",
      };
      if (creditCardId) {
        importPayload.credit_card_id = creditCardId;
      }

      const { data: importRecord, error: insertError } = await supabase
        .from("statement_imports")
        .insert(importPayload)
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        toast.error("Error al registrar la importación");
        return false;
      }

      setStatementImportId(importRecord.id);
      setUploading(false);
      setParsing(true);

      // Call edge function to parse (includes user/workspace for card auto-detection)
      const { data: parseResult, error: parseError } = await supabase.functions.invoke(
        "parse-credit-card-statement",
        {
          body: {
            file_path: filePath,
            statement_import_id: importRecord.id,
            user_id: userId,
            workspace_id: workspaceId,
            credit_card_id: creditCardId || null,
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

      // Store auto-detected card info from edge function
      if (parseResult.credit_card_id) {
        setResolvedCardId(parseResult.credit_card_id);
      }
      if (parseResult.detected_card) {
        setDetectedCard(parseResult.detected_card);
      }

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
          selected: true,
        });
      });

      // Add ajustes (créditos / bonificaciones)
      (data.ajustes || []).forEach((a) => {
        items.push({
          id: `ajuste_${idCounter++}`,
          fecha: "",
          descripcion: a.descripcion,
          monto: a.monto,
          moneda: (a.moneda as "ARS" | "USD") || "ARS",
          cuota_actual: null,
          total_cuotas: null,
          tipo: "ajuste",
          selected: true,
        });
      });

      setExtractedItems(items);

      // Store statement summary and conciliación
      const conciliacion: Conciliacion | null = data.conciliacion
        ? {
            totalConsumosARS: data.conciliacion.total_consumos_ars,
            totalImpuestosARS: data.conciliacion.total_impuestos_ars,
            totalAjustesARS: data.conciliacion.total_ajustes_ars,
            totalCalculadoARS: data.conciliacion.total_calculado_ars,
            totalResumenARS: data.conciliacion.total_resumen_ars,
            diferenciaARS: data.conciliacion.diferencia_ars,
            estadoARS: data.conciliacion.estado_ars,
            totalConsumosUSD: data.conciliacion.total_consumos_usd,
            totalImpuestosUSD: data.conciliacion.total_impuestos_usd,
            totalAjustesUSD: data.conciliacion.total_ajustes_usd,
            totalCalculadoUSD: data.conciliacion.total_calculado_usd,
            totalResumenUSD: data.conciliacion.total_resumen_usd,
            diferenciaUSD: data.conciliacion.diferencia_usd,
            estadoUSD: data.conciliacion.estado_usd,
          }
        : null;

      setStatementSummary({
        totalARS: data.resumen?.total_ars || 0,
        totalUSD: data.resumen?.total_usd || 0,
        fechaVencimiento: data.resumen?.fecha_vencimiento || null,
        fechaCierre: data.resumen?.fecha_cierre || null,
        conciliacion,
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
  }, [workspaceId]);

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

      if (!workspaceId) {
        toast.error("No se pudo determinar el espacio de trabajo");
        return false;
      }

      // 1. Insert consumption transactions into dedicated credit_card_transactions table
      // category_id is null - will be auto-assigned later by AI
      const creditCardTransactions = selectedItems.map((item) => ({
        user_id: userId,
        workspace_id: workspaceId,
        statement_import_id: statementImportId,
        credit_card_id: creditCardId,
        description: item.descripcion,
        amount: item.monto, // Keep negative amounts for bonificaciones/refunds
        currency: item.moneda,
        category_id: null, // Will be auto-assigned by AI post-import
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

      // 2. Trigger auto-categorization in background
      supabase.functions.invoke("auto-categorize-transactions", {
        body: {
          statement_import_id: statementImportId,
          user_id: userId,
        },
      }).then(({ error }) => {
        if (error) {
          console.error("Auto-categorize error:", error);
        } else {
          console.log("Auto-categorization completed");
        }
      });

      // 3. Create payment transactions in main transactions table (impacts cashflow)
      const paymentDate = parsePaymentDate(statementSummary?.fechaVencimiento || null, statementMonth);
      const monthLabel = statementMonth.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

      // Calculate totals from selected items (sum respects negative amounts for bonificaciones)
      const selectedTotalARS = selectedItems
        .filter(item => item.moneda === "ARS")
        .reduce((sum, item) => sum + item.monto, 0);
      const selectedTotalUSD = selectedItems
        .filter(item => item.moneda === "USD")
        .reduce((sum, item) => sum + item.monto, 0);

      // Use statement summary totals if available, otherwise use selected items total
      const totalARS = statementSummary?.totalARS || selectedTotalARS;
      const totalUSD = statementSummary?.totalUSD || selectedTotalUSD;

      const paymentTransactions: Array<{
        user_id: string;
        workspace_id: string;
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
          workspace_id: workspaceId,
          type: "expense",
          amount: totalARS,
          currency: "ARS",
          category: "Tarjeta",
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
          workspace_id: workspaceId,
          type: "expense",
          amount: totalUSD,
          currency: "USD",
          category: "Tarjeta",
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

      // Update statement_imports with transaction count
      await supabase
        .from("statement_imports")
        .update({ transactions_created: selectedItems.length })
        .eq("id", statementImportId);

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
  }, [extractedItems, statementImportId, statementSummary, workspaceId]);

  return {
    uploading,
    parsing,
    importing,
    extractedItems,
    statementImportId,
    statementSummary,
    detectedCard,
    resolvedCardId,
    uploadAndParse,
    toggleItemSelection,
    toggleAllSelection,
    importTransactions,
    reset,
  };
}
