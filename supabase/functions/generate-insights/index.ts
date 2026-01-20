import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  transactionCount: number;
  transactions: Transaction[];
}

interface ConsumptionData {
  month: string;
  total: number;
  byCategory: Record<string, number>;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    // Fetch historical transactions (for cashflow analysis - includes CC payments)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - months_to_analyze);
    
    const { data: allTransactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("date", sixMonthsAgo.toISOString().split("T")[0])
      .order("date", { ascending: false });

    if (txError) {
      console.error("Error fetching transactions:", txError);
      throw txError;
    }

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
      // statement_month is stored as a DATE (YYYY-MM-DD). Filter by statement period, not upload time.
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
        .in("statement_import_id", statementIds);

      if (ccTxError) {
        console.error("Error fetching CC consumption transactions:", ccTxError);
      } else {
        // Map to Transaction interface, using category name from join
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
        cashflowData[month] = { month, total: 0, byCategory: {}, transactionCount: 0, transactions: [] };
      }
      const amountInARS = tx.currency === "USD" ? tx.amount * usdRate : tx.amount;
      cashflowData[month].total += amountInARS;
      cashflowData[month].byCategory[tx.category] = (cashflowData[month].byCategory[tx.category] || 0) + amountInARS;
      cashflowData[month].transactionCount++;
      cashflowData[month].transactions.push(tx);
    });

    // 2. CONSUMPTION DATA: Direct expenses + CC consumptions (excluding CC Payment category)
    const consumptionData: Record<string, ConsumptionData> = {};
    
    // Add direct expenses (excluding Tarjeta category - these are CC payment summaries)
    allTransactions
      .filter((tx: Transaction) => tx.category !== "Tarjeta")
      .forEach((tx: Transaction) => {
        const month = tx.date.substring(0, 7);
        if (!consumptionData[month]) {
          consumptionData[month] = { month, total: 0, byCategory: {}, transactionCount: 0, creditCardBreakdown: {} };
        }
        const amountInARS = tx.currency === "USD" ? tx.amount * usdRate : tx.amount;
        consumptionData[month].total += amountInARS;
        consumptionData[month].byCategory[tx.category] = (consumptionData[month].byCategory[tx.category] || 0) + amountInARS;
        consumptionData[month].transactionCount++;
      });

    // Add CC consumption details, associated with the payment month
    // The detailed CC consumptions are stored as transactions with is_projected=true and payment_method=credit_card.
    // A statement from December (statement_month = 2024-12-01) is typically paid in January.
    if (statementImports && ccConsumptionTransactions.length > 0) {
      const statementPaymentMonthById = new Map<string, string>();
      statementImports.forEach((s: StatementImport) => {
        // statement_month is a DATE string; normalize to the first day of the month
        const stmtDate = new Date(String(s.statement_month));
        // Payment month = month after statement month
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
            transactionCount: 0,
            creditCardBreakdown: {},
          };
        }

        const category = tx.category || "General";
        const amountInARS = tx.currency === "USD" ? tx.amount * usdRate : tx.amount;

        // Track as CC breakdown (for insight generation)
        consumptionData[paymentMonth].creditCardBreakdown[category] =
          (consumptionData[paymentMonth].creditCardBreakdown[category] || 0) + amountInARS;

        // Also add to general category totals for pattern analysis
        consumptionData[paymentMonth].byCategory[category] =
          (consumptionData[paymentMonth].byCategory[category] || 0) + amountInARS;

        consumptionData[paymentMonth].total += amountInARS;
        consumptionData[paymentMonth].transactionCount++;
      });
    }

    const sortedMonths = Object.keys(cashflowData).sort().reverse();
    const currentMonth = sortedMonths[0];
    const previousMonth = sortedMonths[1];

    // 1. ANOMALY DETECTION: Month-over-month category changes (using CONSUMPTION data, not cashflow)
    const consumptionSortedMonths = Object.keys(consumptionData).sort().reverse();
    const consumptionCurrentMonth = consumptionSortedMonths[0];
    const consumptionPreviousMonth = consumptionSortedMonths[1];

    if (consumptionCurrentMonth && consumptionPreviousMonth) {
      const currentData = consumptionData[consumptionCurrentMonth];
      const previousData = consumptionData[consumptionPreviousMonth];

      // Check each category for significant changes (excluding Tarjeta which is already filtered)
      const allCategories = new Set([
        ...Object.keys(currentData.byCategory),
        ...Object.keys(previousData.byCategory),
      ]);

      allCategories.forEach((category) => {
        const current = currentData.byCategory[category] || 0;
        const previous = previousData.byCategory[category] || 0;

        if (previous > 0) {
          const changePercent = ((current - previous) / previous) * 100;

          if (changePercent > 100 && current > 50000) {
            insights.push({
              type: "anomaly",
              priority: "high",
              category,
              title: `${category} subió ${Math.round(changePercent)}%`,
              description: `Gastaste ${formatCurrency(current)} vs ${formatCurrency(previous)} el mes anterior. Un incremento significativo que vale revisar.`,
              data: { current, previous, changePercent: Math.round(changePercent) },
              action: { label: "Ver transacciones", route: `/transactions?category=${encodeURIComponent(category)}` },
            });
          } else if (changePercent < -50 && previous > 50000) {
            insights.push({
              type: "anomaly",
              priority: "medium",
              category,
              title: `${category} bajó ${Math.abs(Math.round(changePercent))}%`,
              description: `Reduciste de ${formatCurrency(previous)} a ${formatCurrency(current)}. ¡Buen trabajo si fue intencional!`,
              data: { current, previous, changePercent: Math.round(changePercent) },
              action: { label: "Ver detalle", route: `/transactions?category=${encodeURIComponent(category)}` },
            });
          }
        } else if (current > 100000) {
          // New category with significant spending
          insights.push({
            type: "anomaly",
            priority: "medium",
            category,
            title: `Nueva categoría: ${category}`,
            description: `Empezaste a gastar en ${category} este mes: ${formatCurrency(current)}`,
            data: { current, previous: 0 },
            action: { label: "Ver transacciones", route: `/transactions?category=${encodeURIComponent(category)}` },
          });
        }
      });

      // Overall consumption change (not cashflow)
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
        });
      }

      // CC BREAKDOWN INSIGHT: If there are CC consumptions, show breakdown
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

    // 2. PATTERN DETECTION: Recurring expenses (using direct transactions excluding Tarjeta)
    const descriptionMap: Record<string, { amounts: number[]; months: Set<string>; category: string }> = {};
    
    // Use direct transactions (excluding Tarjeta) for pattern detection
    const directTransactions = allTransactions.filter((tx: Transaction) => tx.category !== "Tarjeta");
    
    directTransactions.forEach((tx: Transaction) => {
      // Normalize description for matching
      const normalizedDesc = tx.description.toLowerCase().trim();
      const key = normalizedDesc.substring(0, 30); // First 30 chars for grouping
      
      if (!descriptionMap[key]) {
        descriptionMap[key] = { amounts: [], months: new Set(), category: tx.category };
      }
      
      const amountInARS = tx.currency === "USD" ? tx.amount * usdRate : tx.amount;
      descriptionMap[key].amounts.push(amountInARS);
      descriptionMap[key].months.add(tx.date.substring(0, 7));
    });
    
    // Also add CC consumption transactions for pattern detection, mapped to payment month
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

        const normalizedDesc = tx.description.toLowerCase().trim();
        const key = normalizedDesc.substring(0, 30);

        if (!descriptionMap[key]) {
          descriptionMap[key] = { amounts: [], months: new Set(), category: tx.category || "General" };
        }

        const amountInARS = tx.currency === "USD" ? tx.amount * usdRate : tx.amount;
        descriptionMap[key].amounts.push(amountInARS);
        // Month aligned to when you pay the statement
        descriptionMap[key].months.add(paymentMonth);
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
      });
    });

    // 3. TEMPORAL PATTERNS: Day of week analysis (using direct transactions)
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

    // Find highest spending day
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

    // 4. USD SUBSCRIPTIONS tracking (from both direct transactions and CC consumption transactions)
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
          description: `${totalUSDCount} transacciones en USD totalizando $${totalUSD.toFixed(2)} (${formatCurrency(totalUSD * usdRate)} ARS)`,
          data: { totalUSD, monthlyUSD, count: totalUSDCount, arsEquivalent: totalUSD * usdRate },
        });
      }
    }

    // 5. SPENDING PROJECTION (using CASHFLOW data - includes CC payments)
    if (currentMonth) {
      const now = new Date();
      const currentMonthDate = new Date(currentMonth + "-01");
      
      if (now.getMonth() === currentMonthDate.getMonth() && now.getFullYear() === currentMonthDate.getFullYear()) {
        const dayOfMonth = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentSpending = cashflowData[currentMonth]?.total || 0;
        const projectedSpending = (currentSpending / dayOfMonth) * daysInMonth;

        // Compare with average of previous months
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
              title: "Proyección de cierre elevada",
              description: `Al ritmo actual, cerrarías en ${formatCurrency(projectedSpending)} (${Math.round(projectedChange)}% más que tu promedio de ${formatCurrency(avgPreviousMonths)})`,
              data: { projected: projectedSpending, average: avgPreviousMonths, changePercent: Math.round(projectedChange) },
            });
          } else if (projectedChange < -20) {
            insights.push({
              type: "recommendation",
              priority: "low",
              category: null,
              title: "Mes de bajo gasto",
              description: `Vas camino a cerrar en ${formatCurrency(projectedSpending)}, ${Math.abs(Math.round(projectedChange))}% menos que tu promedio`,
              data: { projected: projectedSpending, average: avgPreviousMonths, changePercent: Math.round(projectedChange) },
            });
          }
        }
      }
    }

    // 6. TOP CATEGORY RECOMMENDATION (using CONSUMPTION data - excludes CC Payment)
    if (consumptionCurrentMonth && consumptionData[consumptionCurrentMonth]) {
      const FIXED_CATEGORIES = new Set(["Rent", "Mortgage"]);

      const categoryTotals = Object.entries(consumptionData[consumptionCurrentMonth].byCategory)
        .sort(([, a], [, b]) => (b as number) - (a as number));

      if (categoryTotals.length > 0) {
        const [topCategory, topAmount] = categoryTotals[0] as [string, number];
        const percentage = (topAmount / consumptionData[consumptionCurrentMonth].total) * 100;

        if (percentage > 30) {
          const isFixed = FIXED_CATEGORIES.has(topCategory);

          insights.push({
            type: "recommendation",
            priority: "medium",
            category: topCategory,
            title: `${topCategory} = ${Math.round(percentage)}% del consumo`,
            description: isFixed
              ? "Es un gasto principalmente fijo. Más que recortarlo 20%, úsalo como señal para revisar si está alineado a tu presupuesto/ingresos (p. ej. renegociación o cambios a mediano plazo)."
              : `Tu mayor categoría este mes. Reducir un 20% ahorraría ${formatCurrency(topAmount * 0.2)}`,
            data: {
              category: topCategory,
              amount: topAmount,
              percentage: Math.round(percentage),
              ...(isFixed ? {} : { potentialSaving: topAmount * 0.2 }),
            },
            action: { label: "Analizar", route: `/transactions?category=${encodeURIComponent(topCategory)}` },
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
          totalTransactions: allTransactions.length,
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
