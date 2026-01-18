import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StatementImport {
  id: string;
  user_id: string;
  credit_card_id: string | null;
  file_path: string;
  file_name: string;
  statement_month: string;
  status: string;
  extracted_data: {
    consumos?: Array<{
      fecha: string;
      descripcion: string;
      monto: number;
      moneda: string;
    }>;
    cuotas?: Array<{
      fecha: string;
      descripcion: string;
      monto: number;
      moneda: string;
      cuota_actual: number;
      total_cuotas: number;
    }>;
    impuestos?: Array<{
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
  } | null;
  transactions_created: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditCardTransaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category_id: string | null;
  date: string;
  credit_card_id: string | null;
  statement_import_id: string | null;
  transaction_type: string;
  installment_current: number | null;
  installment_total: number | null;
}

interface UseCreditCardStatementsReturn {
  statements: StatementImport[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getStatementTransactions: (statementImportId: string) => Promise<CreditCardTransaction[]>;
  updateTransactionCategory: (transactionId: string, categoryId: string) => Promise<boolean>;
  bulkUpdateCategories: (transactionIds: string[], categoryId: string) => Promise<boolean>;
  deleteStatement: (statementId: string) => Promise<boolean>;
}

export function useCreditCardStatements(userId: string | null): UseCreditCardStatementsReturn {
  const [statements, setStatements] = useState<StatementImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatements = useCallback(async () => {
    if (!userId) {
      setStatements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("statement_imports")
        .select("*")
        .eq("user_id", userId)
        .order("statement_month", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Cast the extracted_data from Json to our expected type
      const typedStatements: StatementImport[] = (data || []).map(s => ({
        ...s,
        extracted_data: s.extracted_data as StatementImport["extracted_data"],
      }));

      setStatements(typedStatements);
    } catch (err) {
      console.error("Error fetching statements:", err);
      setError("Error al cargar los resúmenes");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

  const getStatementTransactions = useCallback(async (statementImportId: string): Promise<CreditCardTransaction[]> => {
    const { data, error: fetchError } = await supabase
      .from("credit_card_transactions")
      .select("id, description, amount, currency, category_id, date, credit_card_id, statement_import_id, transaction_type, installment_current, installment_total")
      .eq("statement_import_id", statementImportId)
      .order("date", { ascending: false });

    if (fetchError) {
      console.error("Error fetching statement transactions:", fetchError);
      return [];
    }

    return data || [];
  }, []);

  const updateTransactionCategory = useCallback(async (transactionId: string, categoryId: string): Promise<boolean> => {
    const { error: updateError } = await supabase
      .from("credit_card_transactions")
      .update({ category_id: categoryId })
      .eq("id", transactionId);

    if (updateError) {
      console.error("Error updating category:", updateError);
      return false;
    }

    return true;
  }, []);

  const bulkUpdateCategories = useCallback(async (transactionIds: string[], categoryId: string): Promise<boolean> => {
    const { error: updateError } = await supabase
      .from("credit_card_transactions")
      .update({ category_id: categoryId })
      .in("id", transactionIds);

    if (updateError) {
      console.error("Error bulk updating categories:", updateError);
      return false;
    }

    return true;
  }, []);

  const deleteStatement = useCallback(async (statementId: string): Promise<boolean> => {
    try {
      // First delete associated credit card transactions
      const { error: ccTxError } = await supabase
        .from("credit_card_transactions")
        .delete()
        .eq("statement_import_id", statementId);

      if (ccTxError) {
        console.error("Error deleting credit card transactions:", ccTxError);
        return false;
      }

      // Then delete payment transactions from transactions table
      const { error: txError } = await supabase
        .from("transactions")
        .delete()
        .eq("statement_import_id", statementId);

      if (txError) {
        console.error("Error deleting statement payment transactions:", txError);
        return false;
      }

      // Then delete the statement itself
      const { error: stmtError } = await supabase
        .from("statement_imports")
        .delete()
        .eq("id", statementId);

      if (stmtError) {
        console.error("Error deleting statement:", stmtError);
        return false;
      }

      // Update local state
      setStatements(prev => prev.filter(s => s.id !== statementId));
      return true;
    } catch (err) {
      console.error("Error deleting statement:", err);
      return false;
    }
  }, []);

  return {
    statements,
    loading,
    error,
    refetch: fetchStatements,
    getStatementTransactions,
    updateTransactionCategory,
    bulkUpdateCategories,
    deleteStatement,
  };
}
