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

export interface MonthlyTotals {
  month: string;
  totalArs: number;
  totalUsd: number;
  transactionCount: number;
  cardIds: string[];
}

export interface StatementTotals {
  statementId: string;
  totalArs: number;
  totalUsd: number;
  transactionCount: number;
}

interface UseCreditCardStatementsReturn {
  statements: StatementImport[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getStatementTransactions: (statementImportId: string) => Promise<CreditCardTransaction[]>;
  updateTransactionCategory: (transactionId: string, categoryId: string) => Promise<boolean>;
  bulkUpdateCategories: (transactionIds: string[], categoryId: string) => Promise<boolean>;
  deleteStatement: (statementId: string, filePath?: string | null) => Promise<boolean>;
  getMonthlyTransactions: (month: string) => Promise<CreditCardTransaction[]>;
  getMonthlyTotals: () => Promise<MonthlyTotals[]>;
  getStatementTotals: () => Promise<StatementTotals[]>;
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

  const deleteStatement = useCallback(async (statementId: string, filePath?: string | null): Promise<boolean> => {
    try {
      // Fetch file_path if not provided (for storage cleanup)
      let pathToDelete = filePath;
      if (pathToDelete == null) {
        const { data: stmt } = await supabase
          .from("statement_imports")
          .select("file_path")
          .eq("id", statementId)
          .single();
        pathToDelete = stmt?.file_path;
      }

      // 1. Delete associated credit card transactions (consumos, cuotas, impuestos)
      const { error: ccTxError } = await supabase
        .from("credit_card_transactions")
        .delete()
        .eq("statement_import_id", statementId);

      if (ccTxError) {
        console.error("Error deleting credit card transactions:", ccTxError);
        return false;
      }

      // 2. Delete payment transactions from main transactions table (pagos de tarjeta)
      const { error: txError } = await supabase
        .from("transactions")
        .delete()
        .eq("statement_import_id", statementId);

      if (txError) {
        console.error("Error deleting statement payment transactions:", txError);
        return false;
      }

      // 3. Delete PDF file from storage if it exists
      if (pathToDelete && typeof pathToDelete === "string") {
        await supabase.storage.from("credit-card-statements").remove([pathToDelete]);
      }

      // 4. Delete the statement import record
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

  // Get all transactions for a specific month (from all statements in that period)
  const getMonthlyTransactions = useCallback(async (month: string): Promise<CreditCardTransaction[]> => {
    if (!userId) return [];

    // Get all statement IDs for this month
    const monthPrefix = month.substring(0, 7); // YYYY-MM
    const statementIds = statements
      .filter(s => s.statement_month.startsWith(monthPrefix))
      .map(s => s.id);

    if (statementIds.length === 0) return [];

    const { data, error: fetchError } = await supabase
      .from("credit_card_transactions")
      .select("id, description, amount, currency, category_id, date, credit_card_id, statement_import_id, transaction_type, installment_current, installment_total")
      .in("statement_import_id", statementIds)
      .order("date", { ascending: false });

    if (fetchError) {
      console.error("Error fetching monthly transactions:", fetchError);
      return [];
    }

    return data || [];
  }, [userId, statements]);

  // Get real totals for each month from actual transactions in the database
  const getMonthlyTotals = useCallback(async (): Promise<MonthlyTotals[]> => {
    if (!userId || statements.length === 0) return [];

    // Get all statement IDs
    const statementIds = statements.map(s => s.id);

    const { data, error: fetchError } = await supabase
      .from("credit_card_transactions")
      .select("statement_import_id, amount, currency, credit_card_id")
      .in("statement_import_id", statementIds);

    if (fetchError) {
      console.error("Error fetching monthly totals:", fetchError);
      return [];
    }

    // Group transactions by statement month
    const monthlyData = new Map<string, { ars: number; usd: number; count: number; cardIds: Set<string> }>();

    (data || []).forEach(tx => {
      // Find the statement for this transaction
      const statement = statements.find(s => s.id === tx.statement_import_id);
      if (!statement) return;

      const monthKey = statement.statement_month.substring(0, 7) + "-01";

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { ars: 0, usd: 0, count: 0, cardIds: new Set() });
      }

      const data = monthlyData.get(monthKey)!;
      data.count += 1;
      if (tx.currency === "ARS") {
        data.ars += tx.amount;
      } else if (tx.currency === "USD") {
        data.usd += tx.amount;
      }
      if (tx.credit_card_id) {
        data.cardIds.add(tx.credit_card_id);
      }
    });

    return Array.from(monthlyData.entries()).map(([month, totals]) => ({
      month,
      totalArs: totals.ars,
      totalUsd: totals.usd,
      transactionCount: totals.count,
      cardIds: Array.from(totals.cardIds),
    }));
  }, [userId, statements]);

  // Get real totals for each statement from actual transactions
  const getStatementTotals = useCallback(async (): Promise<StatementTotals[]> => {
    if (!userId || statements.length === 0) return [];

    const statementIds = statements.map(s => s.id);

    const { data, error: fetchError } = await supabase
      .from("credit_card_transactions")
      .select("statement_import_id, amount, currency")
      .in("statement_import_id", statementIds);

    if (fetchError) {
      console.error("Error fetching statement totals:", fetchError);
      return [];
    }

    // Group by statement
    const statementData = new Map<string, { ars: number; usd: number; count: number }>();

    (data || []).forEach(tx => {
      const stmtId = tx.statement_import_id;
      if (!stmtId) return;

      if (!statementData.has(stmtId)) {
        statementData.set(stmtId, { ars: 0, usd: 0, count: 0 });
      }

      const data = statementData.get(stmtId)!;
      data.count += 1;
      if (tx.currency === "ARS") {
        data.ars += tx.amount;
      } else if (tx.currency === "USD") {
        data.usd += tx.amount;
      }
    });

    return Array.from(statementData.entries()).map(([statementId, totals]) => ({
      statementId,
      totalArs: totals.ars,
      totalUsd: totals.usd,
      transactionCount: totals.count,
    }));
  }, [userId, statements]);

  return {
    statements,
    loading,
    error,
    refetch: fetchStatements,
    getStatementTransactions,
    updateTransactionCategory,
    bulkUpdateCategories,
    deleteStatement,
    getMonthlyTransactions,
    getMonthlyTotals,
    getStatementTotals,
  };
}
