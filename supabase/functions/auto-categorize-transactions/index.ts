import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Transaction {
  id: string;
  description: string;
  transaction_type: string;
  amount: number;
  currency: string;
}

interface HistoricalMatch {
  description: string;
  category_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { statement_import_id, user_id } = await req.json();
    
    if (!statement_import_id || !user_id) {
      throw new Error("statement_import_id and user_id are required");
    }

    console.log("[auto-categorize] Starting for statement:", statement_import_id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get all transactions from this import that need categorization
    const { data: transactions, error: txError } = await supabase
      .from("credit_card_transactions")
      .select("id, description, transaction_type, amount, currency")
      .eq("statement_import_id", statement_import_id)
      .is("category_id", null);

    if (txError) {
      console.error("[auto-categorize] Error fetching transactions:", txError);
      throw new Error("Failed to fetch transactions");
    }

    if (!transactions || transactions.length === 0) {
      console.log("[auto-categorize] No transactions to categorize");
      return new Response(
        JSON.stringify({ success: true, categorized: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[auto-categorize] Found", transactions.length, "transactions to categorize");

    // 2. Get user's categories
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id, name, type")
      .or(`user_id.eq.${user_id},user_id.is.null`)
      .order("name");

    if (catError || !categories) {
      console.error("[auto-categorize] Error fetching categories:", catError);
      throw new Error("Failed to fetch categories");
    }

    console.log("[auto-categorize] Found", categories.length, "categories");

    // 3. Get historical categorized transactions for matching
    const { data: historicalTx, error: histError } = await supabase
      .from("credit_card_transactions")
      .select("description, category_id")
      .eq("user_id", user_id)
      .not("category_id", "is", null)
      .neq("statement_import_id", statement_import_id);

    // Build a map of normalized descriptions to category IDs
    const historicalMap = new Map<string, string>();
    if (historicalTx) {
      historicalTx.forEach((tx: HistoricalMatch) => {
        const normalizedDesc = normalizeDescription(tx.description);
        if (!historicalMap.has(normalizedDesc)) {
          historicalMap.set(normalizedDesc, tx.category_id);
        }
      });
    }

    console.log("[auto-categorize] Historical matches available:", historicalMap.size);

    // 4. Split transactions: those with historical match vs those needing AI
    const updates: Array<{ id: string; category_id: string }> = [];
    const needsAI: Transaction[] = [];

    for (const tx of transactions) {
      const normalizedDesc = normalizeDescription(tx.description);
      const historicalCategoryId = historicalMap.get(normalizedDesc);
      
      if (historicalCategoryId) {
        updates.push({ id: tx.id, category_id: historicalCategoryId });
      } else {
        needsAI.push(tx);
      }
    }

    console.log("[auto-categorize] Historical matches:", updates.length, "Need AI:", needsAI.length);

    // 5. Use AI to categorize remaining transactions
    if (needsAI.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }

      const categoryList = categories.map((c: Category) => `- ${c.name} (${c.type})`).join("\n");
      const transactionsList = needsAI.map((tx: Transaction) => 
        `ID: ${tx.id} | Descripción: "${tx.description}" | Tipo: ${tx.transaction_type} | ${tx.currency} ${tx.amount}`
      ).join("\n");

      const prompt = `Eres un experto en finanzas personales. Categoriza las siguientes transacciones de tarjeta de crédito argentina.

CATEGORÍAS DISPONIBLES:
${categoryList}

TRANSACCIONES A CATEGORIZAR:
${transactionsList}

REGLAS:
- Cada transacción debe asignarse a UNA categoría de la lista
- MERCADOPAGO, MERPAGO, tiendas online → Shopping
- NETFLIX, SPOTIFY, DISNEY, HBO, suscripciones → Subscriptions  
- UBER, CABIFY, combustibles, estacionamiento → Transportation
- RAPPI, PEDIDOSYA, restaurantes → Dining
- Supermercados (JUMBO, CARREFOUR, COTO, DIA) → Groceries
- Farmacias → Healthcare
- Impuestos, IVA, percepción → Taxes
- Si no estás seguro, usa "General"

Responde SOLO con un JSON array así:
[
  {"id": "uuid-aqui", "category": "Nombre de Categoría"},
  ...
]`;

      console.log("[auto-categorize] Calling AI for", needsAI.length, "transactions");

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "user", content: prompt }
          ],
          max_tokens: 4000,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("[auto-categorize] AI error:", aiResponse.status, errorText);
        // Continue with historical matches only
      } else {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (content) {
          try {
            let jsonStr = content.trim();
            if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
            else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
            if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
            jsonStr = jsonStr.trim();

            const aiCategories = JSON.parse(jsonStr) as Array<{ id: string; category: string }>;
            
            // Map AI suggestions to category IDs
            for (const suggestion of aiCategories) {
              const category = categories.find((c: Category) => 
                c.name.toLowerCase() === suggestion.category.toLowerCase()
              );
              if (category) {
                updates.push({ id: suggestion.id, category_id: category.id });
              }
            }
            
            console.log("[auto-categorize] AI categorized:", aiCategories.length);
          } catch (parseError) {
            console.error("[auto-categorize] Failed to parse AI response:", content);
          }
        }
      }
    }

    // 6. Apply all category updates
    let categorizedCount = 0;
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("credit_card_transactions")
        .update({ category_id: update.category_id })
        .eq("id", update.id);

      if (!updateError) {
        categorizedCount++;
      } else {
        console.error("[auto-categorize] Update error for", update.id, updateError);
      }
    }

    console.log("[auto-categorize] Successfully categorized:", categorizedCount);

    return new Response(
      JSON.stringify({
        success: true,
        categorized: categorizedCount,
        total: transactions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[auto-categorize] Error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Normalize description for matching (remove dates, numbers, etc.)
function normalizeDescription(desc: string): string {
  return desc
    .toUpperCase()
    .replace(/\d{2}\/\d{2}(\/\d{4})?/g, "") // Remove dates
    .replace(/\(\d+\/\d+\)/g, "") // Remove installment info
    .replace(/\s+/g, " ")
    .trim();
}
