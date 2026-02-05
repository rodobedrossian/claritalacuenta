import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  type: string;
  user_id: string;
  payment_method?: string;
  statement_import_id?: string;
}

interface StatementImport {
  id: string;
  statement_month: string;
  created_at: string;
}

interface MonthlyData {
  month: string;
  total: number;
  byCategory: Record<string, number>;
  byCategoryCount: Record<string, number>; // NEW: track transaction count per category
  transactionCount: number;
  transactions: Transaction[];
}

interface ConsumptionData {
  month: string;
  total: number;
  byCategory: Record<string, number>;
  byCategoryCount: Record<string, number>; // NEW: track transaction count per category
  transactionCount: number;
  creditCardBreakdown: Record<string, number>;
}

interface Insight {
  type: "anomaly" | "pattern" | "trend" | "recommendation";
  priority: "high" | "medium" | "low";
  category: string | null;
  title: string;
  description: string;
  data: Record<string, unknown>;
  action?: { label: string; route: string };
}

interface RecurringExpense {
  description: string;
  avgAmount: number;
  count: number;
  category: string;
  months: string[];
}

interface CategoryStats {
  values: number[];
  counts: number[];
}

// ========== HELPER FUNCTIONS ==========

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// NEW: Normalize merchant names for better recurring detection
function normalizeMerchant(description: string): string {
  return description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\d+/g, "") // Remove all numbers
    .replace(/[*#\-_.\/\\@&+:;,!?()[\]{}'"<>|~`$%^=]/g, " ") // Remove special chars
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim()
    .split(" ")
    .filter(word => word.length > 1) // Remove single-char words
    .slice(0, 4) // Take first 4 words
    .join(" ");
}

// NEW: Calculate median and MAD for statistical anomaly detection
function calculateMedianMAD(values: number[]): { median: number; mad: number } {
  if (values.length === 0) return { median: 0, mad: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
  
  // MAD = median of absolute deviations from median
  const deviations = values.map(v => Math.abs(v - median)).sort((a, b) => a - b);
  const madMid = Math.floor(deviations.length / 2);
  const mad = deviations.length % 2 !== 0 
    ? deviations[madMid] 
    : (deviations[madMid - 1] + deviations[madMid]) / 2;
  
  return { median, mad };
}

// ========== MAIN FUNCTION ==========

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { months_to_analyze = 6 } = await req.json().catch(() => ({}));

    // Fetch categories to build a name map
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("id, name");
    
    const categoryMap = new Map<string, string>();
    const nameToIdMap = new Map<string, string>();
    for (const c of (categoriesData || [])) {
      categoryMap.set(c.id, c.name);
      nameToIdMap.set(c.name, c.id);
    }
    
    // Get the UUID for "Tarjeta" category to filter CC payment transactions
    const tarjetaCategoryId = nameToIdMap.get("Tarjeta") || "2eee47f0-252a-4580-8672-0ec0bdd6f11d";

    // Fixed categories in Spanish for top category insight
    const FIXED_CATEGORIES = new Set(["Alquiler", "Servicios", "Impuestos", "Crédito", "Seguros"]);

    // Fetch historical transactions (for cashflow analysis - includes CC payments)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - months_to_analyze);
    
    const { data: rawTransactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", sixMonthsAgo.toISOString().split("T")[0])
      .order("date", { ascending: false })
      .limit(2000);

    if (txError) {
      console.error("Error fetching transactions:", txError);
      throw txError;
    }

    // Filter for analysis but keep all for metadata if needed
    const expenseTransactions = (rawTransactions || []).filter((t: any) => t.type === "expense");

    // Map category IDs to names
    const allTransactions: Transaction[] = expenseTransactions.map((t: any) => ({
      ...t,
      category: categoryMap.get(t.category) || t.category
    }));
    
    // Fetch exchange rate for USD conversion
    const { data: exchangeRate } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("source", "blue")
      .single();

    const usdRate = exchangeRate?.rate || 1200;

    // Fetch recent statement imports to get credit card consumption details
    const { data: statementImports, error: stmtError } = await supabase
      .from("statement_imports")
      .select("id, statement_month, created_at")
      .eq("user_id", user.id)
      .gte("statement_month", sixMonthsAgo.toISOString().split("T")[0])
      .order("statement_month", { ascending: false });

    if (stmtError) {
      console.error("Error fetching statement imports:", stmtError);
    }

    // Fetch credit card consumption transactions from dedicated table with category names
    let ccConsumptionTransactions: Transaction[] = [];
    if (statementImports && statementImports.length > 0) {
      const statementIds = statementImports.map((s: StatementImport) => s.id);
      const { data: ccTxs, error: ccTxError } = await supabase
        .from("credit_card_transactions")
        .select("id, description, amount, currency, category_id, date, transaction_type, user_id, statement_import_id, credit_card_id, categories(name)")
        .eq("user_id", user.id)
        .in("statement_import_id", statementIds)
        .limit(2000);

      if (ccTxError) {
        console.error("Error fetching CC consumption transactions:", ccTxError);
      } else {
        ccConsumptionTransactions = (ccTxs || []).map((t: any) => ({
          ...t,
          type: "expense",
          category: t.categories?.name || "Sin categoría"
        })) as Transaction[];
      }
    }

    console.log(
      `Analyzing ${allTransactions?.length || 0} cashflow transactions and ${ccConsumptionTransactions.length} CC consumptions for user ${user.id}`
    );

    const insights: Insight[] = [];

    if (!allTransactions || allTransactions.length === 0) {
      return new Response(
        JSON.stringify({ insights: [], message: "No hay suficientes datos para generar insights" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === DUAL ANALYSIS SETUP ===
    
    // 1. CASHFLOW DATA: All transactions including CC payments (for projections)
    const cashflowData: Record<string, MonthlyData> = {};
    
    allTransactions.forEach((tx: Transaction) => {
      const month = tx.date.substring(0, 7);
      if (!cashflowData[month]) {
        cashflowData[month] = { month, total: 0, byCategory: {}, byCategoryCount: {}, transactionCount: 0, transactions: [] };
      }
      const amountInARS = tx.currency === "USD" ? tx.amount * usdRate : tx.amount;
      cashflowData[month].total += amountInARS;
      cashflowData[month].byCategory[tx.category] = (cashflowData[month].byCategory[tx.category] || 0) + amountInARS;
      cashflowData[month].byCategoryCount[tx.category] = (cashflowData[month].byCategoryCount[tx.category] || 0) + 1;
      cashflowData[month].transactionCount++;
      cashflowData[month].transactions.push(tx);
    });

    // 2. CONSUMPTION DATA: Direct expenses + CC consumptions (excluding CC Payment category)
    const consumptionData: Record<string, ConsumptionData> = {};
    
    // Add direct expenses (excluding Tarjeta category - these are CC payment summaries)
    allTransactions
      .filter((tx: Transaction) => tx.category !== "Tarjeta" && tx.category !== tarjetaCategoryId)
      .forEach((tx: Transaction) => {
        const month = tx.date.substring(0, 7);
        if (!consumptionData[month]) {
          consumptionData[month] = { month, total: 0, byCategory: {}, byCategoryCount: {}, transactionCount: 0, creditCardBreakdown: {} };
        }
        const amountInARS = tx.currency === "USD" ? tx.amount * usdRate : tx.amount;
        consumptionData[month].total += amountInARS;
        consumptionData[month].byCategory[tx.category] = (consumptionData[month].byCategory[tx.category] || 0) + amountInARS;
        consumptionData[month].byCategoryCount[tx.category] = (consumptionData[month].byCategoryCount[tx.category] || 0) + 1;
        consumptionData[month].transactionCount++;
      });

    // Add CC consumption details, associated with the payment month
    if (statementImports && ccConsumptionTransactions.length > 0) {
      const statementPaymentMonthById = new Map<string, string>();
      statementImports.forEach((s: StatementImport) => {
        const stmtDate = new Date(String(s.statement_month));
        stmtDate.setMonth(stmtDate.getMonth() + 1);
        const paymentMonth = stmtDate.toISOString().substring(0, 7);
        statementPaymentMonthById.set(s.id, paymentMonth);
      });

      ccConsumptionTransactions.forEach((tx: Transaction) => {
        if (!tx.statement_import_id) return;

        const paymentMonth = statementPaymentMonthById.get(tx.statement_import_id);
        if (!paymentMonth) return;

        if (!consumptionData[paymentMonth]) {
          consumptionData[paymentMonth] = {
            month: paymentMonth,
            total: 0,
            byCategory: {},
            byCategoryCount: {},
            transactionCount: 0,
            creditCardBreakdown: {},
          };
        }

        const category = tx.category || "General";
        const amountInARS = tx.currency === "USD" ? tx.amount * usdRate : tx.amount;

        consumptionData[paymentMonth].creditCardBreakdown[category] =
          (consumptionData[paymentMonth].creditCardBreakdown[category] || 0) + amountInARS;

        consumptionData[paymentMonth].byCategory[category] =
          (consumptionData[paymentMonth].byCategory[category] || 0) + amountInARS;
        consumptionData[paymentMonth].byCategoryCount[category] =
          (consumptionData[paymentMonth].byCategoryCount[category] || 0) + 1;

        consumptionData[paymentMonth].total += amountInARS;
        consumptionData[paymentMonth].transactionCount++;
      });
    }

    const sortedMonths = Object.keys(cashflowData).sort().reverse();
    const currentMonth = sortedMonths[0];

    // 1. ANOMALY DETECTION with STATISTICAL BASELINE (using CONSUMPTION data)
    const consumptionSortedMonths = Object.keys(consumptionData).sort().reverse();
    const consumptionCurrentMonth = consumptionSortedMonths[0];
    const consumptionPreviousMonth = consumptionSortedMonths[1];

    // Build historical stats per category for dynamic thresholds
    const categoryHistoricalStats: Record<string, CategoryStats> = {};
    consumptionSortedMonths.slice(1).forEach((month) => { // Exclude current month
      const monthData = consumptionData[month];
      Object.entries(monthData.byCategory).forEach(([cat, amount]) => {
        if (!categoryHistoricalStats[cat]) {
          categoryHistoricalStats[cat] = { values: [], counts: [] };
        }
        categoryHistoricalStats[cat].values.push(amount as number);
        categoryHistoricalStats[cat].counts.push(monthData.byCategoryCount[cat] || 1);
      });
    });

    if (consumptionCurrentMonth && consumptionPreviousMonth) {
      const currentData = consumptionData[consumptionCurrentMonth];
      const previousData = consumptionData[consumptionPreviousMonth];

      const allCategories = new Set([
        ...Object.keys(currentData.byCategory),
        ...Object.keys(previousData.byCategory),
      ]);

      allCategories.forEach((category) => {
        const current = currentData.byCategory[category] || 0;
        const previous = previousData.byCategory[category] || 0;
        const currentCount = currentData.byCategoryCount[category] || 0;
        const previousCount = previousData.byCategoryCount[category] || 0;
        
        // Use statistical baseline if we have enough history
        const stats = categoryHistoricalStats[category];
        let isAnomaly = false;
        let anomalyDescription = "";
        let anomalyPriority: "high" | "medium" | "low" = "medium";

        if (stats && stats.values.length >= 2) {
          // Use median + MAD for robust anomaly detection
          const { median, mad } = calculateMedianMAD(stats.values);
          const threshold = Math.max(median * 1.8, median + mad * 2.5);
          const minAbsoluteDelta = 30000; // Minimum ARS difference to trigger
          
          if (current > threshold && (current - median) > minAbsoluteDelta) {
            isAnomaly = true;
            const changeFromMedian = ((current - median) / median) * 100;
            
            // Determine if it's volume vs ticket change
            const { median: countMedian } = calculateMedianMAD(stats.counts);
            const countChange = countMedian > 0 ? ((currentCount - countMedian) / countMedian) * 100 : 0;
            const avgTicketCurrent = currentCount > 0 ? current / currentCount : current;
            const avgTicketMedian = countMedian > 0 ? median / countMedian : median;
            const ticketChange = avgTicketMedian > 0 ? ((avgTicketCurrent - avgTicketMedian) / avgTicketMedian) * 100 : 0;

            // Build contextual description
            if (countChange > 40 && ticketChange > 30) {
              anomalyDescription = `Más transacciones (+${Math.round(countChange)}%) y ticket más alto (+${Math.round(ticketChange)}%). Gastaste ${formatCurrency(current)} vs mediana de ${formatCurrency(median)}.`;
            } else if (countChange > 40) {
              anomalyDescription = `Pasaste de ~${Math.round(countMedian)} a ${currentCount} transacciones. Total: ${formatCurrency(current)} vs mediana ${formatCurrency(median)}.`;
            } else if (ticketChange > 30) {
              anomalyDescription = `El ticket promedio subió ${Math.round(ticketChange)}% (${formatCurrency(avgTicketCurrent)} vs ${formatCurrency(avgTicketMedian)}). Total: ${formatCurrency(current)}.`;
            } else {
              anomalyDescription = `Gastaste ${formatCurrency(current)} vs tu mediana de ${formatCurrency(median)} (+${Math.round(changeFromMedian)}%).`;
            }
            
            anomalyPriority = changeFromMedian > 100 ? "high" : "medium";
          }
        } else if (previous > 0) {
          // Fallback to simple month-over-month comparison
          const changePercent = ((current - previous) / previous) * 100;

          if (changePercent > 80 && current > 40000) {
            isAnomaly = true;
            
            // Check count vs ticket
            const avgTicketCurrent = currentCount > 0 ? current / currentCount : current;
            const avgTicketPrevious = previousCount > 0 ? previous / previousCount : previous;
            const countChange = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;
            const ticketChange = avgTicketPrevious > 0 ? ((avgTicketCurrent - avgTicketPrevious) / avgTicketPrevious) * 100 : 0;

            if (countChange > 40 && ticketChange > 30) {
              anomalyDescription = `Más compras (+${Math.round(countChange)}%) y más caras (+${Math.round(ticketChange)}%). Total: ${formatCurrency(current)} vs ${formatCurrency(previous)}.`;
            } else if (countChange > 40) {
              anomalyDescription = `Pasaste de ${previousCount} a ${currentCount} transacciones. Total: ${formatCurrency(current)} vs ${formatCurrency(previous)}.`;
            } else if (ticketChange > 30) {
              anomalyDescription = `El ticket promedio subió ${Math.round(ticketChange)}%. Total: ${formatCurrency(current)} vs ${formatCurrency(previous)}.`;
            } else {
              anomalyDescription = `Gastaste ${formatCurrency(current)} vs ${formatCurrency(previous)} el mes anterior (+${Math.round(changePercent)}%).`;
            }
            
            anomalyPriority = changePercent > 100 ? "high" : "medium";
          } else if (changePercent < -50 && previous > 50000) {
            // Spending dropped significantly
            insights.push({
              type: "anomaly",
              priority: "low",
              category,
              title: `${category} bajó ${Math.abs(Math.round(changePercent))}%`,
              description: `Reduciste de ${formatCurrency(previous)} a ${formatCurrency(current)}. ¡Buen trabajo si fue intencional!`,
              data: { current, previous, changePercent: Math.round(changePercent) },
              action: { label: "Ver detalle", route: `/transactions?category=${encodeURIComponent(category)}` },
            });
          }
        } else if (current > 80000) {
          // New category with significant spending
          isAnomaly = true;
          anomalyDescription = `Empezaste a gastar en ${category} este mes: ${formatCurrency(current)}`;
          anomalyPriority = "medium";
        }

        if (isAnomaly && category !== "Tarjeta") {
          insights.push({
            type: "anomaly",
            priority: anomalyPriority,
            category,
            title: `${category}: gasto inusual`,
            description: anomalyDescription,
            data: { 
              current, 
              previous, 
              currentCount, 
              previousCount,
              avgTicketCurrent: currentCount > 0 ? current / currentCount : 0,
              avgTicketPrevious: previousCount > 0 ? previous / previousCount : 0
            },
            action: { label: "Ver transacciones", route: `/transactions?category=${encodeURIComponent(category)}` },
          });
        }
      });

      // Overall consumption change
      const totalChange = ((currentData.total - previousData.total) / previousData.total) * 100;
      if (Math.abs(totalChange) > 30) {
        insights.push({
          type: "trend",
          priority: totalChange > 0 ? "high" : "low",
          category: null,
          title: totalChange > 0 
            ? `Consumo mensual +${Math.round(totalChange)}%` 
            : `Consumo mensual ${Math.round(totalChange)}%`,
          description: totalChange > 0
            ? `Este mes consumiste ${formatCurrency(currentData.total)} vs ${formatCurrency(previousData.total)} el anterior`
            : `Excelente control: de ${formatCurrency(previousData.total)} a ${formatCurrency(currentData.total)}`,
          data: { current: currentData.total, previous: previousData.total, changePercent: Math.round(totalChange) },
          action: { label: "Ver mes", route: `/transactions` },
        });
      }

      // CC BREAKDOWN INSIGHT
      if (Object.keys(currentData.creditCardBreakdown).length > 0) {
        const ccTotal = Object.values(currentData.creditCardBreakdown).reduce((a, b) => a + b, 0);
        const topCCCategories = Object.entries(currentData.creditCardBreakdown)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);
        
        if (ccTotal > 100000) {
          const breakdown = topCCCategories
            .map(([cat, amt]) => `${cat}: ${Math.round((amt / ccTotal) * 100)}%`)
            .join(", ");
          
          insights.push({
            type: "pattern",
            priority: "high",
            category: null,
            title: `Desglose de consumos TC: ${formatCurrency(ccTotal)}`,
            description: `Tu pago de tarjeta se compone de: ${breakdown}`,
            data: { total: ccTotal, breakdown: Object.fromEntries(topCCCategories) },
            action: { label: "Ver resumen", route: "/credit-cards" },
          });
        }
      }
    }

    // 2. PATTERN DETECTION: Recurring expenses with improved merchant normalization
    const descriptionMap: Record<string, { amounts: number[]; months: Set<string>; category: string; rawDescriptions: Set<string> }> = {};
    
    const directTransactions = allTransactions.filter((tx: Transaction) => 
      tx.category !== "Tarjeta" && tx.category !== tarjetaCategoryId
    );
    
    directTransactions.forEach((tx: Transaction) => {
      // Use improved normalization
      const normalizedDesc = normalizeMerchant(tx.description);
      if (normalizedDesc.length < 3) return; // Skip very short normalized descriptions
      
      if (!descriptionMap[normalizedDesc]) {
        descriptionMap[normalizedDesc] = { amounts: [], months: new Set(), category: tx.category, rawDescriptions: new Set() };
      }
      
      const amountInARS = tx.currency === "USD" ? tx.amount * usdRate : tx.amount;
      descriptionMap[normalizedDesc].amounts.push(amountInARS);
      descriptionMap[normalizedDesc].months.add(tx.date.substring(0, 7));
      descriptionMap[normalizedDesc].rawDescriptions.add(tx.description);
    });
    
    // Also add CC consumption transactions for pattern detection
    if (statementImports && ccConsumptionTransactions.length > 0) {
      const statementPaymentMonthById = new Map<string, string>();
      statementImports.forEach((s: StatementImport) => {
        const stmtDate = new Date(String(s.statement_month));
        stmtDate.setMonth(stmtDate.getMonth() + 1);
        statementPaymentMonthById.set(s.id, stmtDate.toISOString().substring(0, 7));
      });

      ccConsumptionTransactions.forEach((tx: Transaction) => {
        if (!tx.statement_import_id) return;
        const paymentMonth = statementPaymentMonthById.get(tx.statement_import_id);
        if (!paymentMonth) return;

        const normalizedDesc = normalizeMerchant(tx.description);
        if (normalizedDesc.length < 3) return;

        if (!descriptionMap[normalizedDesc]) {
          descriptionMap[normalizedDesc] = { amounts: [], months: new Set(), category: tx.category || "General", rawDescriptions: new Set() };
        }

        const amountInARS = tx.currency === "USD" ? tx.amount * usdRate : tx.amount;
        descriptionMap[normalizedDesc].amounts.push(amountInARS);
        descriptionMap[normalizedDesc].months.add(paymentMonth);
        descriptionMap[normalizedDesc].rawDescriptions.add(tx.description);
      });
    }

    const recurringExpenses: RecurringExpense[] = [];
    
    Object.entries(descriptionMap).forEach(([desc, data]) => {
      if (data.amounts.length >= 3 && data.months.size >= 2) {
        const avgAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
        const stdDev = Math.sqrt(
          data.amounts.reduce((sum, val) => sum + Math.pow(val - avgAmount, 2), 0) / data.amounts.length
        );
        
        // Low variance = recurring expense
        if (stdDev / avgAmount < 0.3 || data.amounts.length >= 5) {
          recurringExpenses.push({
            description: desc,
            avgAmount,
            count: data.amounts.length,
            category: data.category,
            months: Array.from(data.months),
          });
        }
      }
    });

    // Sort by total impact (avg * count)
    recurringExpenses.sort((a, b) => (b.avgAmount * b.count) - (a.avgAmount * a.count));

    // Top recurring expenses as patterns
    recurringExpenses.slice(0, 3).forEach((expense) => {
      insights.push({
        type: "pattern",
        priority: "medium",
        category: expense.category,
        title: `${capitalize(expense.description)} es recurrente`,
        description: `${expense.count} veces, promedio ${formatCurrency(expense.avgAmount)} cada vez. Total: ${formatCurrency(expense.avgAmount * expense.count)}`,
        data: { avgAmount: expense.avgAmount, count: expense.count, total: expense.avgAmount * expense.count },
        action: { label: "Ver en transacciones", route: `/transactions` },
      });
    });

    // 3. TEMPORAL PATTERNS: Day of week analysis
    const dayOfWeekSpending: Record<number, { total: number; count: number }> = {};
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    
    directTransactions.forEach((tx: Transaction) => {
      const date = new Date(tx.date);
      const day = date.getDay();
      if (!dayOfWeekSpending[day]) {
        dayOfWeekSpending[day] = { total: 0, count: 0 };
      }
      const amountInARS = tx.currency === "USD" ? tx.amount * usdRate : tx.amount;
      dayOfWeekSpending[day].total += amountInARS;
      dayOfWeekSpending[day].count++;
    });

    let maxDay = 0;
    let maxAvg = 0;
    Object.entries(dayOfWeekSpending).forEach(([day, data]) => {
      const avg = data.total / data.count;
      if (avg > maxAvg && data.count >= 5) {
        maxAvg = avg;
        maxDay = parseInt(day);
      }
    });

    if (maxAvg > 0) {
      insights.push({
        type: "pattern",
        priority: "low",
        category: null,
        title: `Los ${dayNames[maxDay]} gastás más`,
        description: `Promedio de ${formatCurrency(maxAvg)} por transacción los ${dayNames[maxDay]}`,
        data: { day: dayNames[maxDay], avgAmount: maxAvg },
      });
    }

    // 4. USD SUBSCRIPTIONS tracking with actionable route
    const usdDirectTransactions = directTransactions.filter((tx: Transaction) => tx.currency === "USD");
    const usdCCTxs = ccConsumptionTransactions.filter((tx: Transaction) => tx.currency === "USD");

    const totalDirectUSD = usdDirectTransactions.reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
    const totalCCUSD = usdCCTxs.reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
    const totalUSD = totalDirectUSD + totalCCUSD;
    const totalUSDCount = usdDirectTransactions.length + usdCCTxs.length;
    
    if (totalUSD > 0) {
      const monthlyUSD = totalUSD / Math.max(sortedMonths.length, 1);
      
      if (monthlyUSD > 10) {
        insights.push({
          type: "trend",
          priority: "medium",
          category: "Subscriptions",
          title: `Gastos en USD: ~$${monthlyUSD.toFixed(2)}/mes`,
          description: `${totalUSDCount} transacciones en USD totalizando $${totalUSD.toFixed(2)} (${formatCurrency(totalUSD * usdRate)} ARS). Revisá si podés cancelar o pausar alguna.`,
          data: { totalUSD, monthlyUSD, count: totalUSDCount, arsEquivalent: totalUSD * usdRate },
          action: { label: "Ver gastos USD", route: `/transactions` },
        });
      }
    }

    // 5. CASHFLOW PROJECTION (includes CC payments - for liquidity planning)
    if (currentMonth) {
      const now = new Date();
      const currentMonthDate = new Date(currentMonth + "-01");
      
      if (now.getMonth() === currentMonthDate.getMonth() && now.getFullYear() === currentMonthDate.getFullYear()) {
        const dayOfMonth = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentSpending = cashflowData[currentMonth]?.total || 0;
        const projectedSpending = (currentSpending / dayOfMonth) * daysInMonth;

        const previousMonthsData = sortedMonths.slice(1, 4).map(m => cashflowData[m]?.total || 0);
        const avgPreviousMonths = previousMonthsData.length > 0 
          ? previousMonthsData.reduce((a, b) => a + b, 0) / previousMonthsData.length 
          : 0;

        if (avgPreviousMonths > 0) {
          const projectedChange = ((projectedSpending - avgPreviousMonths) / avgPreviousMonths) * 100;
          
          if (projectedChange > 20) {
            insights.push({
              type: "recommendation",
              priority: "high",
              category: null,
              title: "Proyección de cashflow elevada",
              description: `Al ritmo actual, tus egresos cerrarían en ${formatCurrency(projectedSpending)} (${Math.round(projectedChange)}% más que tu promedio de ${formatCurrency(avgPreviousMonths)}). Incluye pagos de tarjeta.`,
              data: { projected: projectedSpending, average: avgPreviousMonths, changePercent: Math.round(projectedChange), type: "cashflow" },
              action: { label: "Ver transacciones grandes", route: `/transactions` },
            });
          } else if (projectedChange < -20) {
            insights.push({
              type: "recommendation",
              priority: "low",
              category: null,
              title: "Mes de bajo egreso",
              description: `Vas camino a cerrar en ${formatCurrency(projectedSpending)}, ${Math.abs(Math.round(projectedChange))}% menos que tu promedio`,
              data: { projected: projectedSpending, average: avgPreviousMonths, changePercent: Math.round(projectedChange), type: "cashflow" },
            });
          }
        }
      }
    }

    // 6. CONSUMPTION PROJECTION (excludes CC payments - for spending habits)
    if (consumptionCurrentMonth) {
      const now = new Date();
      const currentMonthDate = new Date(consumptionCurrentMonth + "-01");
      
      if (now.getMonth() === currentMonthDate.getMonth() && now.getFullYear() === currentMonthDate.getFullYear()) {
        const dayOfMonth = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentConsumption = consumptionData[consumptionCurrentMonth]?.total || 0;
        const projectedConsumption = (currentConsumption / dayOfMonth) * daysInMonth;

        const previousConsumptionMonths = consumptionSortedMonths.slice(1, 4).map(m => consumptionData[m]?.total || 0);
        const avgPreviousConsumption = previousConsumptionMonths.length > 0 
          ? previousConsumptionMonths.reduce((a, b) => a + b, 0) / previousConsumptionMonths.length 
          : 0;

        if (avgPreviousConsumption > 0 && Math.abs(projectedConsumption - avgPreviousConsumption) > 50000) {
          const projectedChange = ((projectedConsumption - avgPreviousConsumption) / avgPreviousConsumption) * 100;
          
          if (projectedChange > 15) {
            insights.push({
              type: "recommendation",
              priority: "medium",
              category: null,
              title: "Proyección de consumo alta",
              description: `Tu consumo real (sin pagos TC) proyecta a ${formatCurrency(projectedConsumption)}, ${Math.round(projectedChange)}% más que tu promedio de ${formatCurrency(avgPreviousConsumption)}.`,
              data: { projected: projectedConsumption, average: avgPreviousConsumption, changePercent: Math.round(projectedChange), type: "consumption" },
              action: { label: "Revisar hábitos", route: `/transactions` },
            });
          }
        }
      }
    }

    // 7. TOP CATEGORY RECOMMENDATION (using CONSUMPTION data)
    if (consumptionCurrentMonth && consumptionData[consumptionCurrentMonth]) {
      const categoryTotals = Object.entries(consumptionData[consumptionCurrentMonth].byCategory)
        .sort(([, a], [, b]) => (b as number) - (a as number));

      if (categoryTotals.length > 0) {
        const [topCategory, topAmount] = categoryTotals[0] as [string, number];
        const percentage = (topAmount / consumptionData[consumptionCurrentMonth].total) * 100;

        if (percentage > 20) {
          const isFixed = FIXED_CATEGORIES.has(topCategory);

          insights.push({
            type: "recommendation",
            priority: "medium",
            category: topCategory,
            title: `${topCategory} = ${Math.round(percentage)}% del consumo`,
            description: isFixed
              ? "Es un gasto principalmente fijo. Revisá si está alineado a tu presupuesto (renegociación o cambios a mediano plazo)."
              : `Tu mayor categoría este mes. Reducir un 20% ahorraría ${formatCurrency(topAmount * 0.2)}`,
            data: {
              category: topCategory,
              amount: topAmount,
              percentage: Math.round(percentage),
              isFixed,
              ...(isFixed ? {} : { potentialSaving: topAmount * 0.2 }),
            },
            action: isFixed 
              ? { label: "Ver detalle", route: `/transactions?category=${encodeURIComponent(topCategory)}` }
              : { label: "Crear presupuesto", route: `/budgets` },
          });
        }
      }
    }

    // Sort insights by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Limit to top 10 insights
    const topInsights = insights.slice(0, 10);

    console.log(`Generated ${topInsights.length} insights for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        insights: topInsights,
        metadata: {
          analyzedMonths: sortedMonths.length,
          totalTransactions: rawTransactions?.length || 0,
          totalStatementTransactions: ccConsumptionTransactions.length,
          generatedAt: new Date().toISOString(),
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating insights:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
