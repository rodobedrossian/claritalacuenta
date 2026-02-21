import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Monday = 0, Tuesday = 1, ... Sunday = 6 (for display order Lun–Dom) */
function getWeekdayIndex(dateStr: string): number {
  // dateStr may be a full ISO timestamp or a plain YYYY-MM-DD
  const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const d = new Date(datePart + "T12:00:00");
  const jsDay = d.getDay(); // 0 = Sun, 1 = Mon, ...
  return (jsDay + 6) % 7;
}

interface RequestBody {
  days?: 30 | 60;
  workspace_id?: string;
}

interface CategoryAmount {
  categoryName: string;
  amount: number;
  currency: string;
  amountARS: number; // ARS-equivalent for sorting
}

interface WeekdayData {
  weekday: number;
  label: string;
  total: number;
  byCategory: CategoryAmount[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const days = body.days === 60 ? 60 : 30;
    const workspace_id = body.workspace_id || undefined;

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    // Fetch categories first so we can identify "Tarjeta" category
    const categoriesResult = await supabase.from("categories").select("id, name").order("name");
    const categoryMap = new Map<string, string>();
    // Hard-code known UUIDs as safety net + dynamically detect others
    const TARJETA_UUID = "2eee47f0-252a-4580-8672-0ec0bdd6f11d";
    const TARJETA_TEXT = "Tarjeta";
    const ALQUILER_UUID = "0c1645cf-bf73-4702-bde9-e4d04b5300ef";
    const excludedCatIds = new Set<string>([TARJETA_UUID, TARJETA_TEXT, ALQUILER_UUID]);
    for (const c of categoriesResult.data || []) {
      categoryMap.set(c.id, c.name);
      const lower = c.name.toLowerCase();
      if (lower === "tarjeta" || lower === "alquiler") excludedCatIds.add(c.id);
    }
    

    const [
      exchangeRateResult,
      transactionsResult,
      ccTransactionsResult,
    ] = await Promise.all([
      supabase
        .from("exchange_rates")
        .select("rate")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      (async () => {
        // Exclude credit card statement payments (category "Tarjeta" as UUID or text)
        // since those amounts are already broken down in credit_card_transactions.
        let query = supabase
          .from("transactions")
          .select("date, category, amount, currency")
          .eq("type", "expense")
          .neq("payment_method", "credit_card")
          .neq("category", TARJETA_UUID)
          .neq("category", TARJETA_TEXT)
          .neq("category", ALQUILER_UUID)
          .gte("date", startStr)
          .lte("date", endStr);
        if (workspace_id) query = query.eq("workspace_id", workspace_id);
        const result = await query;
        // JS safety: filter out any remaining Tarjeta-like categories (case variations)
        return {
          ...result,
          data: (result.data || []).filter((t) => {
            if (excludedCatIds.has(t.category)) return false;
            if (typeof t.category === "string") {
              const lower = t.category.toLowerCase();
              if (lower === "tarjeta" || lower === "alquiler") return false;
            }
            return true;
          }),
        };
      })(),
      (async () => {
        // Only include consumos and first cuotas (not impuestos/ajustes)
        // to reflect actual spending patterns
        const consumos = await (() => {
          let q = supabase
            .from("credit_card_transactions")
            .select("date, category_id, amount, currency")
            .eq("transaction_type", "consumo")
            .gte("date", startStr)
            .lte("date", endStr);
          if (workspace_id) q = q.eq("workspace_id", workspace_id);
          return q;
        })();
        const firstCuotas = await (() => {
          let q = supabase
            .from("credit_card_transactions")
            .select("date, category_id, amount, currency")
            .eq("transaction_type", "cuota")
            .eq("installment_current", 1)
            .gte("date", startStr)
            .lte("date", endStr);
          if (workspace_id) q = q.eq("workspace_id", workspace_id);
          return q;
        })();
        const data = [...(consumos.data || []), ...(firstCuotas.data || [])]
          .filter((t) => !t.category_id || !excludedCatIds.has(t.category_id));
        return { data, error: consumos.error || firstCuotas.error };
      })(),
    ]);

    const rate = exchangeRateResult.data?.rate != null
      ? (typeof exchangeRateResult.data.rate === "string"
          ? parseFloat(exchangeRateResult.data.rate)
          : exchangeRateResult.data.rate)
      : 1300;

    const byWeekday: WeekdayData[] = WEEKDAY_LABELS.map((label, i) => ({
      weekday: i,
      label,
      total: 0,
      byCategory: [] as CategoryAmount[],
    }));

    const categorySumsByWeekday: Map<number, Map<string, { amount: number; currency: string; amountARS: number }>> = new Map();
    for (let i = 0; i < 7; i++) {
      categorySumsByWeekday.set(i, new Map());
    }

    for (const t of transactionsResult.data || []) {
      const dateStr = t.date;
      if (!dateStr) continue;
      const weekday = getWeekdayIndex(dateStr);
      const categoryName = categoryMap.get(t.category) || t.category || "Sin categoría";
      const amount = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
      const currency = t.currency || "ARS";

      const totalInARS = currency === "USD" ? amount * rate : amount;
      byWeekday[weekday].total += totalInARS;

      const catMap = categorySumsByWeekday.get(weekday)!;
      const key = `${categoryName}|${currency}`;
      const existing = catMap.get(key);
      if (existing) {
        existing.amount += amount;
        existing.amountARS += totalInARS;
      } else {
        catMap.set(key, { amount, currency, amountARS: totalInARS });
      }
    }

    for (const t of ccTransactionsResult.data || []) {
      const dateStr = t.date;
      if (!dateStr) continue;
      const weekday = getWeekdayIndex(dateStr);
      const categoryName = t.category_id ? (categoryMap.get(t.category_id) || "Sin categoría") : "Sin categoría";
      const amount = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
      const currency = t.currency || "ARS";

      const totalInARS = currency === "USD" ? amount * rate : amount;
      byWeekday[weekday].total += totalInARS;

      const catMap = categorySumsByWeekday.get(weekday)!;
      const key = `${categoryName}|${currency}`;
      const existing = catMap.get(key);
      if (existing) {
        existing.amount += amount;
        existing.amountARS += totalInARS;
      } else {
        catMap.set(key, { amount, currency, amountARS: totalInARS });
      }
    }

    for (let i = 0; i < 7; i++) {
      const catMap = categorySumsByWeekday.get(i)!;
      byWeekday[i].byCategory = Array.from(catMap.entries())
        .map(([key, { amount, currency, amountARS }]) => {
          const categoryName = key.split("|")[0];
          return { categoryName, amount, currency, amountARS };
        })
        .sort((a, b) => b.amountARS - a.amountARS);
    }

    return new Response(
      JSON.stringify({
        byWeekday,
        exchangeRate: rate,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-spending-by-weekday:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
