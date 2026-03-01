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

## Formato
- Respondé de forma concisa pero completa
- Usá markdown para formatear texto (negritas, listas, etc.)
- Combiná texto explicativo con visualizaciones cuando sea útil
- Si no tenés datos suficientes para responder, decilo claramente`;

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
        "Busca consumos de tarjeta de crédito con filtros. Incluye cuotas.",
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

// ─── Tool execution ──────────────────────────────────────────────
async function executeTool(
  name: string,
  args: Record<string, any>,
  supabase: any,
  workspaceId: string
): Promise<string> {
  try {
    switch (name) {
      case "query_transactions": {
        let query = supabase
          .from("transactions")
          .select("id, amount, category, currency, type, description, date, payment_method, status")
          .eq("workspace_id", workspaceId)
          .eq("status", "confirmed")
          .order("date", { ascending: false })
          .limit(args.limit || 50);

        if (args.date_from) query = query.gte("date", args.date_from);
        if (args.date_to) query = query.lte("date", args.date_to + "T23:59:59");
        if (args.category) query = query.ilike("category", `%${args.category}%`);
        if (args.currency) query = query.eq("currency", args.currency);
        if (args.type) query = query.eq("type", args.type);
        if (args.min_amount) query = query.gte("amount", args.min_amount);
        if (args.max_amount) query = query.lte("amount", args.max_amount);
        if (args.description_search) query = query.ilike("description", `%${args.description_search}%`);

        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ count: data.length, transactions: data });
      }

      case "query_credit_card_transactions": {
        let query = supabase
          .from("credit_card_transactions")
          .select(
            "id, amount, currency, description, date, transaction_type, installment_current, installment_total, credit_card_id"
          )
          .eq("workspace_id", workspaceId)
          .order("date", { ascending: false })
          .limit(args.limit || 50);

        if (args.date_from) query = query.gte("date", args.date_from);
        if (args.date_to) query = query.lte("date", args.date_to);
        if (args.currency) query = query.eq("currency", args.currency);

        // If card_name filter, resolve card id first
        if (args.card_name) {
          const { data: cards } = await supabase
            .from("credit_cards")
            .select("id")
            .eq("workspace_id", workspaceId)
            .ilike("name", `%${args.card_name}%`);
          if (cards && cards.length > 0) {
            query = query.in(
              "credit_card_id",
              cards.map((c: any) => c.id)
            );
          }
        }

        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });

        // Enrich with card names
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
        }));

        return JSON.stringify({ count: enriched?.length || 0, transactions: enriched });
      }

      case "get_monthly_summary": {
        const months = args.months || 3;
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
            .select("amount, type, currency")
            .eq("workspace_id", workspaceId)
            .eq("status", "confirmed")
            .gte("date", from)
            .lte("date", to);

          const summary = { month: from.slice(0, 7), income_ars: 0, expense_ars: 0, income_usd: 0, expense_usd: 0 };
          for (const t of data || []) {
            const key = `${t.type}_${t.currency.toLowerCase()}`;
            if (key in summary) (summary as any)[key] += Number(t.amount);
          }

          results.push({
            ...summary,
            balance_ars: summary.income_ars - summary.expense_ars,
            balance_usd: summary.income_usd - summary.expense_usd,
          });
        }

        return JSON.stringify(results);
      }

      case "get_category_breakdown": {
        const from = args.date_from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
        const to = args.date_to || new Date().toISOString().split("T")[0];
        const source = args.source || "all";

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
            if (!breakdown[t.category]) breakdown[t.category] = { ars: 0, usd: 0 };
            breakdown[t.category][t.currency.toLowerCase() as "ars" | "usd"] += Number(t.amount);
          }
        }

        if (source === "card" || source === "all") {
          // Get categories mapping
          const { data: cats } = await supabase
            .from("categories")
            .select("id, name")
            .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`);
          const catMap: Record<string, string> = {};
          for (const c of cats || []) catMap[c.id] = c.name;

          const { data } = await supabase
            .from("credit_card_transactions")
            .select("category_id, amount, currency")
            .eq("workspace_id", workspaceId)
            .gte("date", from)
            .lte("date", to);

          for (const t of data || []) {
            const catName = catMap[t.category_id] || "Sin categoría";
            if (!breakdown[catName]) breakdown[catName] = { ars: 0, usd: 0 };
            breakdown[catName][t.currency.toLowerCase() as "ars" | "usd"] += Number(t.amount);
          }
        }

        const result = Object.entries(breakdown)
          .map(([category, amounts]) => ({ category, ...amounts }))
          .sort((a, b) => b.ars + b.usd - (a.ars + a.usd));

        return JSON.stringify(result);
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

        return JSON.stringify({
          savings: savings || { ars_amount: 0, usd_amount: 0, ars_cash: 0, usd_cash: 0 },
          goals: goals || [],
          investments: investments || [],
        });
      }

      case "get_budgets_status": {
        const { data: budgets } = await supabase
          .from("budgets")
          .select("*")
          .eq("workspace_id", workspaceId)
          .eq("is_active", true);

        if (!budgets || budgets.length === 0) return JSON.stringify([]);

        // Get current month spending per category
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

        const spending: Record<string, number> = {};
        for (const t of txns || []) {
          // Only count matching currency
          spending[t.category] = (spending[t.category] || 0) + Number(t.amount);
        }

        const result = budgets.map((b: any) => ({
          category: b.category,
          currency: b.currency,
          monthly_limit: b.monthly_limit,
          spent: spending[b.category] || 0,
          percentage: Math.round(((spending[b.category] || 0) / b.monthly_limit) * 100),
        }));

        return JSON.stringify(result);
      }

      case "get_exchange_rate": {
        const { data } = await supabase
          .from("exchange_rates")
          .select("rate, source, updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return JSON.stringify(data || { rate: null, source: null });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (e) {
    console.error(`Tool ${name} error:`, e);
    return JSON.stringify({ error: e instanceof Error ? e.message : "Tool execution failed" });
  }
}

// ─── Main handler ────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

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
    const { messages } = await req.json();

    // Build messages with system prompt
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    // Tool-calling loop
    let currentMessages = aiMessages;
    let iterations = 0;
    let finalResponse: any = null;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

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

      if (!choice) {
        return new Response(JSON.stringify({ error: "No response from AI" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If AI wants to call tools
      if (choice.finish_reason === "tool_calls" || choice.message?.tool_calls?.length) {
        const toolCalls = choice.message.tool_calls;

        // Add assistant message with tool calls
        currentMessages.push(choice.message);

        // Execute each tool and add results
        for (const tc of toolCalls) {
          const toolArgs = typeof tc.function.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments;

          console.log(`Executing tool: ${tc.function.name}`, toolArgs);
          const result = await executeTool(tc.function.name, toolArgs, supabase, workspaceId);

          currentMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
          });
        }

        // Continue loop to let AI process tool results
        continue;
      }

      // AI responded with text (no more tool calls)
      finalResponse = choice.message?.content || "";

      // Log usage
      const usage = aiData.usage;
      if (usage) {
        await supabase.from("ai_usage_logs").insert({
          user_id: userId,
          workspace_id: workspaceId,
          function_name: "financial-chat",
          model: "google/gemini-2.5-flash",
          prompt_tokens: usage.prompt_tokens || 0,
          completion_tokens: usage.completion_tokens || 0,
          total_tokens: usage.total_tokens || 0,
        });
      }

      break;
    }

    if (finalResponse === null) {
      finalResponse = "Lo siento, no pude procesar tu consulta. Intentá de nuevo.";
    }

    return new Response(JSON.stringify({ content: finalResponse }), {
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
