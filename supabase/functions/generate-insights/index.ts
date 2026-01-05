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
  is_projected: boolean;
  user_id: string;
}

interface MonthlyData {
  month: string;
  total: number;
  byCategory: Record<string, number>;
  transactionCount: number;
  transactions: Transaction[];
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

    // Fetch historical transactions
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - months_to_analyze);
    
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .eq("is_projected", false)
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

    console.log(`Analyzing ${transactions?.length || 0} transactions for user ${user.id}`);

    const insights: Insight[] = [];

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ insights: [], message: "No hay suficientes datos para generar insights" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Organize transactions by month
    const monthlyData: Record<string, MonthlyData> = {};
    
    transactions.forEach((tx: Transaction) => {
      const month = tx.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          total: 0,
          byCategory: {},
          transactionCount: 0,
          transactions: [],
        };
      }
      
      const amountInARS = tx.currency === "USD" ? tx.amount * usdRate : tx.amount;
      monthlyData[month].total += amountInARS;
      monthlyData[month].byCategory[tx.category] = (monthlyData[month].byCategory[tx.category] || 0) + amountInARS;
      monthlyData[month].transactionCount++;
      monthlyData[month].transactions.push(tx);
    });

    const sortedMonths = Object.keys(monthlyData).sort().reverse();
    const currentMonth = sortedMonths[0];
    const previousMonth = sortedMonths[1];

    // 1. ANOMALY DETECTION: Month-over-month category changes
    if (currentMonth && previousMonth) {
      const currentData = monthlyData[currentMonth];
      const previousData = monthlyData[previousMonth];

      // Check each category for significant changes
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

      // Overall spending change
      const totalChange = ((currentData.total - previousData.total) / previousData.total) * 100;
      if (Math.abs(totalChange) > 30) {
        insights.push({
          type: "trend",
          priority: totalChange > 0 ? "high" : "low",
          category: null,
          title: totalChange > 0 
            ? `Gasto mensual +${Math.round(totalChange)}%` 
            : `Gasto mensual ${Math.round(totalChange)}%`,
          description: totalChange > 0
            ? `Este mes vas ${formatCurrency(currentData.total)} vs ${formatCurrency(previousData.total)} el anterior`
            : `Excelente control: de ${formatCurrency(previousData.total)} a ${formatCurrency(currentData.total)}`,
          data: { current: currentData.total, previous: previousData.total, changePercent: Math.round(totalChange) },
        });
      }
    }

    // 2. PATTERN DETECTION: Recurring expenses
    const descriptionMap: Record<string, { amounts: number[]; months: Set<string>; category: string }> = {};
    
    transactions.forEach((tx: Transaction) => {
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

    // 3. TEMPORAL PATTERNS: Day of week analysis
    const dayOfWeekSpending: Record<number, { total: number; count: number }> = {};
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    
    transactions.forEach((tx: Transaction) => {
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

    // 4. USD SUBSCRIPTIONS tracking
    const usdTransactions = transactions.filter((tx: Transaction) => tx.currency === "USD");
    if (usdTransactions.length > 0) {
      const totalUSD = usdTransactions.reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
      const monthlyUSD = totalUSD / sortedMonths.length;
      
      if (monthlyUSD > 10) {
        insights.push({
          type: "trend",
          priority: "medium",
          category: "Subscriptions",
          title: `Gastos en USD: ~$${monthlyUSD.toFixed(2)}/mes`,
          description: `${usdTransactions.length} transacciones en USD totalizando $${totalUSD.toFixed(2)} (${formatCurrency(totalUSD * usdRate)} ARS)`,
          data: { totalUSD, monthlyUSD, count: usdTransactions.length, arsEquivalent: totalUSD * usdRate },
        });
      }
    }

    // 5. SPENDING PROJECTION
    if (currentMonth) {
      const now = new Date();
      const currentMonthDate = new Date(currentMonth + "-01");
      
      if (now.getMonth() === currentMonthDate.getMonth() && now.getFullYear() === currentMonthDate.getFullYear()) {
        const dayOfMonth = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentSpending = monthlyData[currentMonth].total;
        const projectedSpending = (currentSpending / dayOfMonth) * daysInMonth;

        // Compare with average of previous months
        const previousMonthsData = sortedMonths.slice(1, 4).map(m => monthlyData[m]?.total || 0);
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

    // 6. TOP CATEGORY RECOMMENDATION
    if (currentMonth) {
      const categoryTotals = Object.entries(monthlyData[currentMonth].byCategory)
        .sort(([, a], [, b]) => b - a);
      
      if (categoryTotals.length > 0) {
        const [topCategory, topAmount] = categoryTotals[0];
        const percentage = (topAmount / monthlyData[currentMonth].total) * 100;
        
        if (percentage > 30) {
          insights.push({
            type: "recommendation",
            priority: "medium",
            category: topCategory,
            title: `${topCategory} = ${Math.round(percentage)}% del gasto`,
            description: `Tu mayor categoría este mes. Reducir un 20% ahorraría ${formatCurrency(topAmount * 0.2)}`,
            data: { category: topCategory, amount: topAmount, percentage: Math.round(percentage), potentialSaving: topAmount * 0.2 },
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
          totalTransactions: transactions.length,
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
