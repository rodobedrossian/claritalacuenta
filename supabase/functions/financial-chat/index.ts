import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MAX_TOOL_ITERATIONS = 5;

// ─── System prompt ───────────────────────────────────────────────
const SYSTEM_PROMPT = `Sos Clarita, una asistente financiera inteligente que ayuda a los usuarios a entender sus finanzas personales. Hablás en español argentino, de forma clara, amigable y con datos concretos.

## Reglas estrictas
- NUNCA des recomendaciones de inversión (no sugerir comprar dólar, plazo fijo, acciones, crypto, etc.)
- NUNCA sugieras mudarse a un alquiler más barato, hacer menos deporte, vender el auto, o cambios de estilo de vida drásticos
- SÍ podés analizar tendencias de gastos, identificar categorías discrecionales que crecieron, y proyectar metas de ahorro
- SÍ podés hacer cálculos, comparaciones entre meses, y mostrar visualizaciones
- Cuando muestres montos en ARS usá el formato $1.234.567 (punto como separador de miles)
- Cuando muestres montos en USD usá el formato US$1,234
- La fecha de hoy es ${new Date().toISOString().split("T")[0]}

## Balance consolidado
Cuando el resumen mensual tenga ingresos y gastos en ARS y USD, usá los campos "income_consolidado_ars", "expense_consolidado_ars" y "balance_consolidado_ars" que ya vienen calculados usando el tipo de cambio actual e incluyen consumos de tarjeta de crédito. Reportá el balance mensual como un único número consolidado en ARS (no en USD). No digas "negativo en ARS y positivo en USD". Lo que importa es si los ingresos totales alcanzaron para cubrir los gastos totales. Si el balance consolidado es positivo, decí que el mes cerró con superávit. Si es negativo, decí que hubo déficit.
Cuando desgloses ingresos y gastos, mostrá los totales consolidados en ARS. Ejemplo: "Ingresos totales consolidados: **$9.615.996 ARS**". Podés mencionar los componentes ARS/USD si es relevante.

## Comportamiento ante preguntas generales
Cuando el usuario haga preguntas amplias o generales como "¿En qué gasto más?", "¿Cómo vengo?", "¿Cuánto gasté?", "¿En qué se me va la tarjeta?", etc., SIEMPRE:
1. Usá get_monthly_summary(months=3) para obtener contexto de los últimos 3 meses
2. Usá get_category_breakdown con date_from de hace 3 meses y source=all para ver la distribución completa
3. Combiná ambos resultados para dar una respuesta rica con tendencias y comparaciones
4. Mostrá visualizaciones (pie chart de categorías, bar chart de meses) para que sea más claro

## Preguntas sobre tarjetas de crédito
Cuando el usuario pregunte sobre tarjetas de crédito de forma general (ej: "¿En qué se me va la tarjeta?", "¿Cuánto gasté con tarjeta?", "¿Qué consumos tengo?"):
- SIEMPRE consultá TODAS las tarjetas (NO filtres por card_name) para dar el panorama completo
- Usá query_credit_card_transactions SIN card_name para traer todo
- Usá get_category_breakdown con source=card para ver distribución por categoría en tarjetas
- Solo filtrá por tarjeta específica si el usuario EXPLÍCITAMENTE menciona una tarjeta por nombre
- Si querés mostrar un breakdown por tarjeta, usá los datos que ya vienen con card_name en el resultado

NO respondas solo con texto cuando hay datos disponibles. SIEMPRE consultá las tools primero.
NO pidas al usuario que especifique una tarjeta si la pregunta es general. Mostrá TODO y después el usuario puede pedir detalle.
NUNCA le pidas al usuario que te diga sus ingresos, gastos o ahorros. Esa información ya la tenés en la base de datos, usá las tools para obtenerla.

## Preguntas sobre metas de ahorro o viabilidad
Cuando el usuario pregunte si puede ahorrar X por mes, si llega a una meta, o si algo es viable:
1. Usá get_monthly_summary(months=3) para ver ingresos y gastos reales
2. Usá get_savings_status() para ver ahorros actuales y metas
3. Calculá el excedente mensual promedio y respondé con datos concretos
4. NUNCA pidas que te cuente sus ingresos o gastos — ya los tenés

## Visualizaciones
Cuando quieras mostrar datos visualmente, insertá bloques especiales en tu respuesta:

Para gráficos:
:::chart
{"chart_type":"pie|bar|line","title":"Título","data":[{"name":"Label","value":123}]}
:::

Para KPIs grandes:
:::kpi
{"label":"Gasto total","value":"$1.234.567","change_percent":-5.2,"change_label":"vs mes anterior"}
:::

Para tablas:
:::table
{"title":"Detalle","headers":["Categoría","Monto"],"rows":[["Comida","$50.000"],["Transporte","$30.000"]]}
:::

Usá estas visualizaciones cuando ayuden a entender los datos. Un pie chart para distribución por categoría, bar chart para comparar meses, line chart para tendencias, KPI para números destacados, tabla para detalles.

## Follow-up suggestions
SIEMPRE al final de tu respuesta, incluí un bloque de sugerencias de seguimiento que el usuario puede clickear. Deben ser 2-3 preguntas cortas, relevantes al contexto de la conversación, que profundicen o amplíen el análisis.

Formato:
:::suggestions
["¿Pregunta 1?", "¿Pregunta 2?", "¿Pregunta 3?"]
:::

Ejemplos de buenas sugerencias:
- Si hablaste de gastos por categoría: "¿Cómo evolucionó Supermercado en los últimos meses?", "¿Cuánto gasté en Salidas vs el mes pasado?"
- Si hablaste de un resumen mensual: "¿Qué día de la semana gasto más?", "¿Cuáles son mis gastos fijos?"
- Si hablaste de tarjetas: "¿Qué cuotas me quedan por pagar?", "¿Cuál tarjeta tiene más consumos?"

## Formato de texto
- Respondé de forma concisa pero completa
- Usá markdown para formatear texto (negritas, listas, etc.)
- Dejá SIEMPRE una línea en blanco entre cada párrafo para separar visualmente. Esto es MUY importante para la legibilidad.
- Usá headers (##, ###) para separar secciones cuando la respuesta es larga
- Combiná texto explicativo con visualizaciones cuando sea útil
- Si no tenés datos suficientes para responder, decilo claramente
- NUNCA pongas un título o header como última línea antes de un bloque :::chart, :::kpi o :::table. El título ya va dentro del bloque de visualización. Si querés introducir una visualización, terminá el párrafo de texto y luego poné el bloque en una sección separada.`;

// ─── Tool definitions ────────────────────────────────────────────
const tools = [
  {
    type: "function",
    function: {
      name: "query_transactions",
      description:
        "Busca transacciones del usuario con filtros opcionales. Devuelve las transacciones que coincidan.",
      parameters: {
        type: "object",
        properties: {
          date_from: { type: "string", description: "Fecha inicio YYYY-MM-DD" },
          date_to: { type: "string", description: "Fecha fin YYYY-MM-DD" },
          category: { type: "string", description: "Nombre de categoría" },
          currency: { type: "string", enum: ["ARS", "USD"] },
          type: { type: "string", enum: ["income", "expense"] },
          min_amount: { type: "number" },
          max_amount: { type: "number" },
          description_search: { type: "string", description: "Búsqueda en la descripción" },
          limit: { type: "number", description: "Máximo de resultados (default 50)" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_credit_card_transactions",
      description:
        "Busca consumos de tarjeta de crédito con filtros. Por defecto trae TODAS las tarjetas. Solo usá card_name si el usuario pidió una tarjeta específica.",
      parameters: {
        type: "object",
        properties: {
          date_from: { type: "string", description: "Fecha inicio YYYY-MM-DD" },
          date_to: { type: "string", description: "Fecha fin YYYY-MM-DD" },
          card_name: { type: "string", description: "Nombre de la tarjeta" },
          currency: { type: "string", enum: ["ARS", "USD"] },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_monthly_summary",
      description:
        "Devuelve un resumen mensual de ingresos, gastos y balance para los últimos N meses.",
      parameters: {
        type: "object",
        properties: {
          months: { type: "number", description: "Cantidad de meses hacia atrás (default 3)" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_category_breakdown",
      description:
        "Desglose de gastos por categoría en un período. Útil para pie charts y análisis.",
      parameters: {
        type: "object",
        properties: {
          date_from: { type: "string", description: "Fecha inicio YYYY-MM-DD" },
          date_to: { type: "string", description: "Fecha fin YYYY-MM-DD" },
          source: {
            type: "string",
            enum: ["cash", "card", "all"],
            description: "Fuente: cash (transacciones), card (tarjeta), all (ambas)",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_savings_status",
      description: "Estado actual de ahorros (ARS/USD), metas de ahorro e inversiones.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_budgets_status",
      description:
        "Presupuestos activos con gasto actual y % de avance del mes en curso.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_exchange_rate",
      description: "Tipo de cambio USD/ARS actual.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

// ─── Category resolution helper ─────────────────────────────────
async function buildCategoryMap(supabase: any, workspaceId: string): Promise<Map<string, string>> {
  const { data: cats } = await supabase
    .from("categories")
    .select("id, name")
    .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`);
  
  const map = new Map<string, string>();
  for (const c of cats || []) {
    map.set(c.id, c.name);
  }
  return map;
}

function resolveCategoryName(category: string, catMap: Map<string, string>): string {
  return catMap.get(category) || category;
}

function findCategoryIds(categoryName: string, catMap: Map<string, string>): string[] {
  const ids: string[] = [];
  for (const [id, name] of catMap) {
    if (name.toLowerCase().includes(categoryName.toLowerCase())) {
      ids.push(id);
    }
  }
  return ids;
}

// ─── Tool execution ──────────────────────────────────────────────
async function executeTool(
  name: string,
  args: Record<string, any>,
  supabase: any,
  workspaceId: string
): Promise<{ result: string; toolName: string }> {
  try {
    switch (name) {
      case "query_transactions": {
        const catMap = await buildCategoryMap(supabase, workspaceId);
        
        let query = supabase
          .from("transactions")
          .select("id, amount, category, currency, type, description, date, payment_method, status")
          .eq("workspace_id", workspaceId)
          .eq("status", "confirmed")
          .order("date", { ascending: false })
          .limit(args.limit || 50);

        if (args.date_from) query = query.gte("date", args.date_from);
        if (args.date_to) query = query.lte("date", args.date_to + "T23:59:59");
        if (args.currency) query = query.eq("currency", args.currency);
        if (args.type) query = query.eq("type", args.type);
        if (args.min_amount) query = query.gte("amount", args.min_amount);
        if (args.max_amount) query = query.lte("amount", args.max_amount);
        if (args.description_search) query = query.ilike("description", `%${args.description_search}%`);
        
        // Category filter: find UUID(s) matching the category name
        if (args.category) {
          const matchingIds = findCategoryIds(args.category, catMap);
          if (matchingIds.length > 0) {
            query = query.in("category", matchingIds);
          } else {
            // Fallback: try direct match (shouldn't happen with normalized data)
            query = query.eq("category", args.category);
          }
        }

        const { data, error } = await query;
        if (error) return { result: JSON.stringify({ error: error.message }), toolName: name };
        
        // Resolve category names
        const enriched = (data || []).map((t: any) => ({
          ...t,
          category: resolveCategoryName(t.category, catMap),
        }));
        
        return { result: JSON.stringify({ count: enriched.length, transactions: enriched }), toolName: name };
      }

      case "query_credit_card_transactions": {
        const catMap = await buildCategoryMap(supabase, workspaceId);
        
        let query = supabase
          .from("credit_card_transactions")
          .select(
            "id, amount, currency, description, date, transaction_type, installment_current, installment_total, credit_card_id, category_id"
          )
          .eq("workspace_id", workspaceId)
          .order("date", { ascending: false })
          .limit(args.limit || 50);

        if (args.date_from) query = query.gte("date", args.date_from);
        if (args.date_to) query = query.lte("date", args.date_to);
        if (args.currency) query = query.eq("currency", args.currency);

        if (args.card_name) {
          const { data: cards } = await supabase
            .from("credit_cards")
            .select("id")
            .eq("workspace_id", workspaceId)
            .ilike("name", `%${args.card_name}%`);
          if (cards && cards.length > 0) {
            query = query.in("credit_card_id", cards.map((c: any) => c.id));
          }
        }

        const { data, error } = await query;
        if (error) return { result: JSON.stringify({ error: error.message }), toolName: name };

        const cardIds = [...new Set(data?.map((t: any) => t.credit_card_id).filter(Boolean))];
        let cardMap: Record<string, string> = {};
        if (cardIds.length) {
          const { data: cards } = await supabase
            .from("credit_cards")
            .select("id, name")
            .in("id", cardIds);
          if (cards) cardMap = Object.fromEntries(cards.map((c: any) => [c.id, c.name]));
        }

        const enriched = data?.map((t: any) => ({
          ...t,
          card_name: cardMap[t.credit_card_id] || null,
          category: resolveCategoryName(t.category_id || "", catMap),
        }));

        return { result: JSON.stringify({ count: enriched?.length || 0, transactions: enriched }), toolName: name };
      }

      case "get_monthly_summary": {
        const months = args.months || 3;
        const catMap = await buildCategoryMap(supabase, workspaceId);
        const results: any[] = [];

        for (let i = 0; i < months; i++) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const year = d.getFullYear();
          const month = d.getMonth();
          const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
          const toDate = new Date(year, month + 1, 0);
          const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(toDate.getDate()).padStart(2, "0")}T23:59:59`;

          const { data } = await supabase
            .from("transactions")
            .select("amount, type, currency, category")
            .eq("workspace_id", workspaceId)
            .eq("status", "confirmed")
            .gte("date", from)
            .lte("date", to);

          const summary = { month: from.slice(0, 7), income_ars: 0, expense_ars: 0, income_usd: 0, expense_usd: 0 };
          for (const t of data || []) {
            const key = `${t.type}_${t.currency.toLowerCase()}`;
            if (key in summary) (summary as any)[key] += Number(t.amount);
          }

          const balanceArs = summary.income_ars - summary.expense_ars;
          const balanceUsd = summary.income_usd - summary.expense_usd;

          results.push({
            ...summary,
            balance_ars: balanceArs,
            balance_usd: balanceUsd,
          });
        }

        // Fetch exchange rate and compute consolidated balance
        const { data: rateData } = await supabase
          .from("exchange_rates")
          .select("rate")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const usdToArs = rateData?.rate || 1;

        const enriched = results.map((r: any) => {
          const totalIncomeArs = r.income_ars + r.income_usd * usdToArs;
          const totalExpenseArs = r.expense_ars + r.expense_usd * usdToArs;
          return {
            ...r,
            income_consolidado_ars: Math.round(totalIncomeArs),
            expense_consolidado_ars: Math.round(totalExpenseArs),
            balance_consolidado_ars: Math.round(totalIncomeArs - totalExpenseArs),
            exchange_rate_used: usdToArs,
          };
        });

        return { result: JSON.stringify(enriched), toolName: name };
      }

      case "get_category_breakdown": {
        const from = args.date_from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
        const to = args.date_to || new Date().toISOString().split("T")[0];
        const source = args.source || "all";
        const catMap = await buildCategoryMap(supabase, workspaceId);

        const breakdown: Record<string, { ars: number; usd: number }> = {};

        if (source === "cash" || source === "all") {
          const { data } = await supabase
            .from("transactions")
            .select("category, amount, currency")
            .eq("workspace_id", workspaceId)
            .eq("status", "confirmed")
            .eq("type", "expense")
            .gte("date", from)
            .lte("date", to + "T23:59:59");

          for (const t of data || []) {
            const catName = resolveCategoryName(t.category, catMap);
            if (!breakdown[catName]) breakdown[catName] = { ars: 0, usd: 0 };
            breakdown[catName][t.currency.toLowerCase() as "ars" | "usd"] += Number(t.amount);
          }
        }

        if (source === "card" || source === "all") {
          const { data } = await supabase
            .from("credit_card_transactions")
            .select("category_id, amount, currency")
            .eq("workspace_id", workspaceId)
            .gte("date", from)
            .lte("date", to);

          for (const t of data || []) {
            const catName = resolveCategoryName(t.category_id || "", catMap);
            if (!breakdown[catName]) breakdown[catName] = { ars: 0, usd: 0 };
            breakdown[catName][t.currency.toLowerCase() as "ars" | "usd"] += Number(t.amount);
          }
        }

        const result = Object.entries(breakdown)
          .map(([category, amounts]) => ({ category, ...amounts }))
          .sort((a, b) => b.ars + b.usd - (a.ars + a.usd));

        return { result: JSON.stringify(result), toolName: name };
      }

      case "get_savings_status": {
        const { data: savings } = await supabase
          .from("savings")
          .select("*")
          .eq("workspace_id", workspaceId)
          .maybeSingle();

        const { data: goals } = await supabase
          .from("savings_goals")
          .select("*")
          .eq("workspace_id", workspaceId);

        const { data: investments } = await supabase
          .from("investments")
          .select("*")
          .eq("workspace_id", workspaceId)
          .eq("is_active", true);

        return {
          result: JSON.stringify({
            savings: savings || { ars_amount: 0, usd_amount: 0, ars_cash: 0, usd_cash: 0 },
            goals: goals || [],
            investments: investments || [],
          }),
          toolName: name,
        };
      }

      case "get_budgets_status": {
        const catMap = await buildCategoryMap(supabase, workspaceId);
        
        const { data: budgets } = await supabase
          .from("budgets")
          .select("*")
          .eq("workspace_id", workspaceId)
          .eq("is_active", true);

        if (!budgets || budgets.length === 0) return { result: JSON.stringify([]), toolName: name };

        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}T23:59:59`;

        const { data: txns } = await supabase
          .from("transactions")
          .select("category, amount, currency")
          .eq("workspace_id", workspaceId)
          .eq("status", "confirmed")
          .eq("type", "expense")
          .gte("date", monthStart)
          .lte("date", monthEnd);

        // Aggregate spending by resolved category name
        const spending: Record<string, number> = {};
        for (const t of txns || []) {
          const catName = resolveCategoryName(t.category, catMap);
          spending[catName] = (spending[catName] || 0) + Number(t.amount);
        }

        const result = budgets.map((b: any) => {
          const budgetCatName = resolveCategoryName(b.category, catMap);
          const spent = spending[budgetCatName] || 0;
          return {
            category: budgetCatName,
            currency: b.currency,
            monthly_limit: b.monthly_limit,
            spent,
            percentage: Math.round((spent / b.monthly_limit) * 100),
          };
        });

        return { result: JSON.stringify(result), toolName: name };
      }

      case "get_exchange_rate": {
        const { data } = await supabase
          .from("exchange_rates")
          .select("rate, source, updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return { result: JSON.stringify(data || { rate: null, source: null }), toolName: name };
      }

      default:
        return { result: JSON.stringify({ error: `Unknown tool: ${name}` }), toolName: name };
    }
  } catch (e) {
    console.error(`Tool ${name} error:`, e);
    return { result: JSON.stringify({ error: e instanceof Error ? e.message : "Tool execution failed" }), toolName: name };
  }
}

// ─── Main handler ────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth - use getUser() for consistency with all other functions
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Resolve workspace
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!membership?.workspace_id) {
      return new Response(JSON.stringify({ error: "No workspace found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const workspaceId = membership.workspace_id;
    const { messages, conversation_id } = await req.json();

    // Service role client for persistence (bypasses RLS for inserts)
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Manage conversation
    let convId = conversation_id;
    if (!convId) {
      // Create new conversation
      const { data: conv, error: convError } = await serviceClient
        .from("chat_conversations")
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          title: messages?.[messages.length - 1]?.content?.slice(0, 100) || "Nueva conversación",
        })
        .select("id")
        .single();
      
      if (convError) {
        console.error("Error creating conversation:", convError);
      } else {
        convId = conv.id;
      }
    }

    // Persist user message
    const lastUserMsg = messages?.[messages.length - 1];
    if (convId && lastUserMsg?.role === "user") {
      await serviceClient.from("chat_messages").insert({
        conversation_id: convId,
        role: "user",
        content: lastUserMsg.content,
      });
    }

    // Build messages with system prompt
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    // Tool-calling loop with token tracking and latency
    let currentMessages = aiMessages;
    let iterations = 0;
    let finalResponse: any = null;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    const allToolCalls: any[] = [];
    const latencyLog: { step: string; duration_ms: number }[] = [];
    const totalStart = Date.now();

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      const aiStart = Date.now();
      const aiResp = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: currentMessages,
          tools,
          stream: false,
        }),
      });
      latencyLog.push({ step: `ai_call_${iterations}`, duration_ms: Date.now() - aiStart });

      if (!aiResp.ok) {
        const status = aiResp.status;
        if (status === 429) {
          return new Response(
            JSON.stringify({ error: "Demasiadas consultas. Intentá de nuevo en unos segundos." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (status === 402) {
          return new Response(
            JSON.stringify({ error: "Créditos insuficientes para usar el chat." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errText = await aiResp.text();
        console.error("AI Gateway error:", status, errText);
        return new Response(JSON.stringify({ error: "Error al consultar la IA" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResp.json();
      const choice = aiData.choices?.[0];

      // Accumulate token usage from every iteration
      const usage = aiData.usage;
      if (usage) {
        totalPromptTokens += usage.prompt_tokens || 0;
        totalCompletionTokens += usage.completion_tokens || 0;
        totalTokens += usage.total_tokens || 0;
      }

      if (!choice) {
        return new Response(JSON.stringify({ error: "No response from AI" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If AI wants to call tools
      if (choice.finish_reason === "tool_calls" || choice.message?.tool_calls?.length) {
        const toolCalls = choice.message.tool_calls;
        currentMessages.push(choice.message);

        for (const tc of toolCalls) {
          const toolArgs = typeof tc.function.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments;

          console.log(`Executing tool: ${tc.function.name}`, toolArgs);
          const toolStart = Date.now();
          const { result } = await executeTool(tc.function.name, toolArgs, supabase, workspaceId);
          latencyLog.push({ step: `tool:${tc.function.name}`, duration_ms: Date.now() - toolStart });

          allToolCalls.push({
            name: tc.function.name,
            args: toolArgs,
            result_preview: result.slice(0, 500),
          });

          currentMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
          });
        }

        continue;
      }

      // AI responded with text
      finalResponse = choice.message?.content || "";
      break;
    }

    const totalDuration = Date.now() - totalStart;
    latencyLog.push({ step: "total", duration_ms: totalDuration });
    console.log("Latency breakdown:", JSON.stringify(latencyLog));

    if (finalResponse === null) {
      finalResponse = "Lo siento, no pude procesar tu consulta. Intentá de nuevo.";
    }

    // Detect visualization types in the response
    const vizTypes: string[] = [];
    if (finalResponse.includes(":::chart")) vizTypes.push("chart");
    if (finalResponse.includes(":::kpi")) vizTypes.push("kpi");
    if (finalResponse.includes(":::table")) vizTypes.push("table");

    // Persist assistant message
    if (convId) {
      await serviceClient.from("chat_messages").insert({
        conversation_id: convId,
        role: "assistant",
        content: finalResponse,
        tool_calls: allToolCalls.length > 0 ? allToolCalls : null,
        visualization_type: vizTypes.length > 0 ? vizTypes.join(",") : null,
        prompt_tokens: totalPromptTokens,
        completion_tokens: totalCompletionTokens,
        total_tokens: totalTokens,
        model: "google/gemini-2.5-flash",
      });
    }

    // Log aggregated usage
    if (totalTokens > 0) {
      await serviceClient.from("ai_usage_logs").insert({
        user_id: userId,
        workspace_id: workspaceId,
        function_name: "financial-chat",
        model: "google/gemini-2.5-flash",
        prompt_tokens: totalPromptTokens,
        completion_tokens: totalCompletionTokens,
        total_tokens: totalTokens,
        reference_id: convId || null,
      });
    }

    return new Response(JSON.stringify({ content: finalResponse, conversation_id: convId, latency: latencyLog }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("financial-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
