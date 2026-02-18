/// <reference path="../deno.d.ts" />
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Deno URL import
// @ts-ignore - resolved at runtime by Deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXTRACTION_PROMPT = `Eres un experto en analizar resúmenes de tarjetas de crédito argentinas. Analiza el siguiente PDF de resumen de tarjeta de crédito y extrae TODOS los consumos, cuotas, impuestos y ajustes/créditos.

=== INSTRUCCIONES CRÍTICAS PARA PARSEO TABULAR ===

**REGLA #1 - ALINEACIÓN FILA POR FILA:**
- CADA línea del PDF representa UNA transacción completa
- El monto SIEMPRE está al FINAL de la línea, alineado a la derecha
- La descripción está en el MEDIO, entre la fecha y el monto
- **NUNCA** mezcles montos de una línea con descripciones de otra línea
- Si una línea dice "APPYPF 00023 COMBUST" seguido de "47.478,68", ese monto corresponde a ESA descripción

**REGLA #2 - FORMATO NUMÉRICO ARGENTINO:**
- Separador de MILES: punto (.)
- Separador de DECIMALES: coma (,)
- Ejemplos de conversión:
  * "47.478,68" en PDF → 47478.68 en JSON (cuarenta y siete mil cuatrocientos setenta y ocho con 68 centavos)
  * "5.490" en PDF → 5490 en JSON (cinco mil cuatrocientos noventa, SIN decimales)
  * "1.234.567,89" → 1234567.89
  * "200,50" → 200.50 (doscientos con 50 centavos)
- Si no hay coma, el número NO tiene decimales

**REGLA #3 - VERIFICACIÓN DE ALINEACIÓN:**
- Antes de retornar, VERIFICA que cada descripción tenga su monto correcto
- Los montos suelen estar alineados verticalmente en una columna a la derecha
- Las fechas están a la izquierda en formato DD/MM/YYYY o similar
- Las descripciones varían en longitud pero el monto siempre está al final de la misma fila

=== REGLAS DE CLASIFICACIÓN ===

1. **CUOTAS**: Cualquier compra que tenga indicador de cuotas va SOLO en el array "cuotas".
   PATRONES DE CUOTAS A DETECTAR:
   - "C.XX/YY" o "C.X/Y" (ej: "C.02/03", "C.1/6") - MUY COMÚN EN VISA
   - "XX/YY" o "X/Y" solo números (ej: "02/03", "1/6")
   - "CUOTA X DE Y" o "CTA X/Y"
   - "(X/Y)" entre paréntesis
   - Cualquier patrón que indique número de cuota actual y total
   
   Ejemplos reales:
   - "ZARA C.02/03" → cuota_actual: 2, total_cuotas: 3
   - "MERPAGO*LIDHERMAMTZ C.02/03" → cuota_actual: 2, total_cuotas: 3
   - "MEGATLON (8/12)" → cuota_actual: 8, total_cuotas: 12
   - "FRAVEGA CUOTA 2 DE 6" → cuota_actual: 2, total_cuotas: 6
   
   IMPORTANTE: Si una línea tiene CUALQUIER patrón de cuota, va ÚNICAMENTE en "cuotas", NUNCA en "consumos"
   
2. **CONSUMOS**: SOLO compras que NO tienen ningún patrón de cuota
   - Son pagos en un solo pago, sin cuotas
   - cuota_actual y total_cuotas deben ser null
   - NO incluir si la línea tiene "C.XX/YY" u otro patrón de cuotas
   
3. **IMPUESTOS**: IVA, percepciones, impuesto PAIS, sellados, cargos administrativos

4. **AJUSTES / CRÉDITOS**: Líneas con signo negativo que son créditos/bonificaciones/devoluciones a favor del tarjetahabiente.
   - Ejemplos reales: "CR.RG 5617 30% M 22.532,13-", "BONIFICACIÓN", "DEVOLUCIÓN", "NOTA DE CRÉDITO"
   - Mantener el monto NEGATIVO en el valor (ej: -22532.13)
   - NO clasificar como impuesto ni como consumo
   - Van en el array "ajustes"
   
   **EXCLUSIONES CRÍTICAS - NO incluir en ajustes ni en ningún otro array:**
   - "SU PAGO EN PESOS", "SU PAGO EN USD", "SU PAGO EN DOLARES", "PAGO EN PESOS", "PAGO EN DOLARES"
   - Cualquier línea que represente el PAGO del saldo anterior del cliente (son movimientos de caja, no del resumen actual)
   - "SALDO ANTERIOR", "SALDO PERIODO ANTERIOR"
   - Estos pagos/saldos anteriores deben ser IGNORADOS completamente, ya que distorsionan la conciliación de totales

IMPORTANTE - EVITAR DUPLICADOS:
- Una transacción va en UN SOLO array (consumos O cuotas O impuestos O ajustes)
- Si tiene CUALQUIER patrón de cuota (C.XX/YY, X/Y, etc.) → solo va en cuotas
- Si es un impuesto/cargo → solo va en impuestos
- Si es un crédito/ajuste/bonificación (monto negativo a favor del cliente) → solo va en ajustes
- Todo lo demás sin patrón de cuota → solo va en consumos

DATOS A EXTRAER:
- Los montos pueden estar en ARS o USD (fijate la sección donde aparecen)
- **MONTOS NEGATIVOS**: Si un monto tiene signo negativo (ej: "-200.883,89"), ES UNA BONIFICACIÓN/DEVOLUCIÓN. MANTENER el signo negativo en el valor.
- Las fechas suelen estar en formato DD/MM o DD-Mon-YY (ej: "15-Nov-25")
- Para fechas como "15-Nov-25", convertir a "15/11/2025"
- IGNORA COMPLETAMENTE: pagos del saldo anterior ("SU PAGO EN PESOS", "SU PAGO EN USD", "PAGO EN PESOS", "SALDO ANTERIOR"), límites de crédito, tasas de interés, info institucional, avisos legales. Estos NO van en NINGÚN array.

Retorna un JSON válido con esta estructura exacta:
{
  "tarjeta": {
    "red": "VISA" | "MASTERCARD" | "AMEX" | "CABAL" | "NARANJA" | "OTRA",
    "banco": "Nombre del banco emisor (ej: Galicia, Santander, BBVA, HSBC, etc.)",
    "numero_cuenta": "Últimos 4 dígitos de la tarjeta o número de cuenta visible en el resumen",
    "titular": "Nombre del titular tal como aparece en el resumen",
    "dia_cierre": 15
  },
  "consumos": [
    {
      "fecha": "DD/MM/YYYY",
      "descripcion": "texto descriptivo SIN el patrón de cuota",
      "monto": 12345.67,
      "moneda": "ARS" o "USD",
      "cuota_actual": null,
      "total_cuotas": null
    }
  ],
  "cuotas": [
    {
      "fecha": "DD/MM/YYYY",
      "descripcion": "texto descriptivo SIN el patrón de cuota (quitar C.XX/YY)",
      "monto": 12345.67,
      "moneda": "ARS" o "USD",
      "cuota_actual": 2,
      "total_cuotas": 6
    }
  ],
  "impuestos": [
    {
      "descripcion": "IVA sobre intereses",
      "monto": 123.45,
      "moneda": "ARS" o "USD"
    }
  ],
  "ajustes": [
    {
      "descripcion": "CR.RG 5617 30%",
      "monto": -22532.13,
      "moneda": "ARS"
    }
  ],
  "resumen": {
    "total_ars": 0,
    "total_usd": 0,
    "fecha_vencimiento": "DD/MM/YYYY",
    "fecha_cierre": "DD/MM/YYYY"
  }
}

INSTRUCCIONES PARA "tarjeta":
- "red": La red de la tarjeta. Buscá logos, textos como "VISA", "MASTERCARD", "AMERICAN EXPRESS", "AMEX", "CABAL", "NARANJA X". Si no está claro, usá "OTRA".
- "banco": El nombre del banco emisor. Aparece en el encabezado del resumen. Extraé solo el nombre comercial (ej: "Galicia" no "Banco de Galicia y Buenos Aires S.A.U.").
- "numero_cuenta": Los últimos 4 dígitos visibles del número de tarjeta, o el número de cuenta/socio si es lo único disponible. Si no hay ninguno, usá null.
- "titular": El nombre completo del titular de la tarjeta como aparece en el resumen. Si no está visible, usá null.
- "dia_cierre": El día del mes en que cierra el resumen (1-31). Extraelo de la fecha de cierre. Si la fecha de cierre es "15/01/2026", el dia_cierre es 15.

IMPORTANTE: Retorna SOLO el objeto JSON puro, SIN markdown, SIN \`\`\`json, SIN texto adicional. Empieza directamente con { y termina con }

TEXTO DEL RESUMEN:
`;

// --- Utility functions for fuzzy card matching ---

function normalizeBank(bank: string): string {
  return bank
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/\b(banco|rio|argentina|sa|sau|s\.a\.?u?\.?|frances|francés)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { file_path, statement_import_id, user_id, workspace_id, credit_card_id } = await req.json();
    
    if (!file_path) {
      throw new Error("file_path is required");
    }
    if (!user_id || !workspace_id) {
      throw new Error("user_id and workspace_id are required");
    }

    console.log("[parse-statement] Starting parse for:", file_path);

    // Initialize Supabase client with service role for storage access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download PDF from storage
    console.log("[parse-statement] Downloading PDF from storage...");
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("credit-card-statements")
      .download(file_path);

    if (downloadError) {
      console.error("[parse-statement] Download error:", downloadError);
      throw new Error(`Failed to download PDF: ${downloadError.message}`);
    }

    // Convert PDF to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Pdf = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    console.log("[parse-statement] PDF downloaded, size:", arrayBuffer.byteLength, "bytes");

    // Call Lovable AI with the PDF
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[parse-statement] Calling AI to extract data...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: EXTRACTION_PROMPT,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`,
                },
              },
            ],
          },
        ],
        max_tokens: 16000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[parse-statement] AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a few minutes.");
      }
      if (aiResponse.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to your workspace.");
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[parse-statement] No content in AI response:", aiData);
      throw new Error("AI did not return any content");
    }

    console.log("[parse-statement] AI response received, parsing JSON...");

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    let extractedData;
    try {
      extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("[parse-statement] Failed to parse AI response as JSON:", content);
      throw new Error("Failed to parse AI response. The PDF format may not be recognized.");
    }

    // Validate structure
    if (!extractedData.consumos) extractedData.consumos = [];
    if (!extractedData.cuotas) extractedData.cuotas = [];
    if (!extractedData.impuestos) extractedData.impuestos = [];
    if (!extractedData.ajustes) extractedData.ajustes = [];
    if (!extractedData.resumen) extractedData.resumen = {};

    const totalItems =
      extractedData.consumos.length +
      extractedData.cuotas.length +
      extractedData.impuestos.length +
      extractedData.ajustes.length;

    // Deterministic reconciliation: compare sum of items vs resumen totals
    const sumByCurrency = (
      items: Array<{ monto: number; moneda?: string }>,
      currency: string
    ) =>
      items
        .filter((x) => (x.moneda || "ARS").toUpperCase() === currency)
        .reduce((acc, x) => acc + Number(x.monto || 0), 0);

    const totalConsumosARS =
      sumByCurrency(extractedData.consumos, "ARS") + sumByCurrency(extractedData.cuotas, "ARS");
    const totalImpuestosARS = sumByCurrency(extractedData.impuestos, "ARS");
    const totalAjustesARS = sumByCurrency(extractedData.ajustes, "ARS");
    const totalCalculadoARS = totalConsumosARS + totalImpuestosARS + totalAjustesARS;
    const totalResumenARS = Number(extractedData.resumen?.total_ars ?? 0);
    const diferenciaARS = totalResumenARS - totalCalculadoARS;

    const totalConsumosUSD =
      sumByCurrency(extractedData.consumos, "USD") + sumByCurrency(extractedData.cuotas, "USD");
    const totalImpuestosUSD = sumByCurrency(extractedData.impuestos, "USD");
    const totalAjustesUSD = sumByCurrency(extractedData.ajustes, "USD");
    const totalCalculadoUSD = totalConsumosUSD + totalImpuestosUSD + totalAjustesUSD;
    const totalResumenUSD = Number(extractedData.resumen?.total_usd ?? 0);
    const diferenciaUSD = totalResumenUSD - totalCalculadoUSD;

    const THRESHOLD_OK = 1;
    const THRESHOLD_MINOR = 100;
    let estadoARS: string;
    let estadoUSD: string;
    if (totalResumenARS === 0 && totalCalculadoARS === 0) {
      estadoARS = "OK - Sin movimientos ARS";
    } else if (Math.abs(diferenciaARS) < THRESHOLD_OK) {
      estadoARS = "OK - Totales conciliados";
    } else if (Math.abs(diferenciaARS) < THRESHOLD_MINOR) {
      estadoARS = "Diferencia menor (redondeos / conversión)";
    } else {
      estadoARS = "Diferencia relevante - posible ajuste no clasificado";
    }
    if (totalResumenUSD === 0 && totalCalculadoUSD === 0) {
      estadoUSD = "OK - Sin movimientos USD";
    } else if (Math.abs(diferenciaUSD) < THRESHOLD_OK) {
      estadoUSD = "OK - Totales conciliados";
    } else if (Math.abs(diferenciaUSD) < THRESHOLD_MINOR) {
      estadoUSD = "Diferencia menor (redondeos / conversión)";
    } else {
      estadoUSD = "Diferencia relevante - posible ajuste no clasificado";
    }

    extractedData.conciliacion = {
      total_consumos_ars: Math.round(totalConsumosARS * 100) / 100,
      total_impuestos_ars: Math.round(totalImpuestosARS * 100) / 100,
      total_ajustes_ars: Math.round(totalAjustesARS * 100) / 100,
      total_calculado_ars: Math.round(totalCalculadoARS * 100) / 100,
      total_resumen_ars: totalResumenARS,
      diferencia_ars: Math.round(diferenciaARS * 100) / 100,
      estado_ars: estadoARS,
      total_consumos_usd: Math.round(totalConsumosUSD * 100) / 100,
      total_impuestos_usd: Math.round(totalImpuestosUSD * 100) / 100,
      total_ajustes_usd: Math.round(totalAjustesUSD * 100) / 100,
      total_calculado_usd: Math.round(totalCalculadoUSD * 100) / 100,
      total_resumen_usd: totalResumenUSD,
      diferencia_usd: Math.round(diferenciaUSD * 100) / 100,
      estado_usd: estadoUSD,
    };

    console.log("[parse-statement] Extracted:", {
      consumos: extractedData.consumos.length,
      cuotas: extractedData.cuotas.length,
      impuestos: extractedData.impuestos.length,
      ajustes: extractedData.ajustes.length,
      total: totalItems,
      conciliacion: extractedData.conciliacion,
      tarjeta: extractedData.tarjeta,
    });

    // --- Card auto-detection ---
    let resolvedCardId = credit_card_id || null;
    let detectedCard: {
      id: string;
      name: string;
      bank: string | null;
      card_network: string | null;
      account_number: string | null;
      closing_day: number | null;
      is_new: boolean;
    } | null = null;

    const tarjeta = extractedData.tarjeta;
    if (tarjeta) {
      const network = (tarjeta.red || "").toUpperCase().trim();
      const banco = (tarjeta.banco || "").trim();
      const numeroCuenta = (tarjeta.numero_cuenta || "").trim();
      const diaCierre = tarjeta.dia_cierre ? Number(tarjeta.dia_cierre) : null;

      // Build a stable identifier: NETWORK_BANK_LAST4 (all lowercased, spaces removed)
      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
      const parts = [normalize(network), normalize(banco), normalize(numeroCuenta)].filter(Boolean);
      const cardIdentifier = parts.length >= 2 ? parts.join("_") : null;

      console.log("[parse-statement] Card identifier:", cardIdentifier);

      if (cardIdentifier && !resolvedCardId) {
        // Step 1: Exact match by card_identifier
        const { data: exactCard } = await supabase
          .from("credit_cards")
          .select("id, name, bank, card_network, account_number, closing_day")
          .eq("workspace_id", workspace_id)
          .eq("card_identifier", cardIdentifier)
          .maybeSingle();

        if (exactCard) {
          console.log("[parse-statement] EXACT match found:", exactCard.id);
          resolvedCardId = exactCard.id;
          detectedCard = { ...exactCard, is_new: false };

          if (diaCierre && !exactCard.closing_day) {
            await supabase
              .from("credit_cards")
              .update({ closing_day: diaCierre })
              .eq("id", exactCard.id);
          }
        } else {
          // Step 2: Fuzzy match — search all cards in workspace
          console.log("[parse-statement] No exact match, attempting fuzzy match...");
          const { data: allCards } = await supabase
            .from("credit_cards")
            .select("id, name, bank, card_network, account_number, closing_day, card_identifier")
            .eq("workspace_id", workspace_id);

          const normalizedNewBank = normalizeBank(banco);
          let fuzzyMatch: typeof allCards extends Array<infer T> ? T : never | null = null;

          if (allCards && allCards.length > 0) {
            const candidates = allCards.filter((card) => {
              // Must match network
              if (network && card.card_network && card.card_network.toUpperCase() !== network) {
                return false;
              }
              // Bank must be similar (normalized)
              const normalizedExistingBank = normalizeBank(card.bank || "");
              if (normalizedNewBank && normalizedExistingBank && normalizedNewBank !== normalizedExistingBank) {
                // Check if one contains the other
                if (!normalizedNewBank.includes(normalizedExistingBank) && !normalizedExistingBank.includes(normalizedNewBank)) {
                  return false;
                }
              }
              // Account number: allow Levenshtein distance <= 1
              if (numeroCuenta && card.account_number) {
                const dist = levenshtein(numeroCuenta, card.account_number);
                if (dist > 1) return false;
              }
              return true;
            });

            if (candidates.length === 1) {
              fuzzyMatch = candidates[0];
            } else if (candidates.length > 1) {
              // Pick the one with closest account_number
              const sorted = candidates.sort((a, b) => {
                const distA = levenshtein(numeroCuenta || "", a.account_number || "");
                const distB = levenshtein(numeroCuenta || "", b.account_number || "");
                return distA - distB;
              });
              fuzzyMatch = sorted[0];
            }
          }

          if (fuzzyMatch) {
            console.log("[parse-statement] FUZZY match found:", fuzzyMatch.id, "name:", fuzzyMatch.name);
            resolvedCardId = fuzzyMatch.id;
            detectedCard = { id: fuzzyMatch.id, name: fuzzyMatch.name, bank: fuzzyMatch.bank, card_network: fuzzyMatch.card_network, account_number: fuzzyMatch.account_number, closing_day: fuzzyMatch.closing_day, is_new: false };

            // Update card_identifier and closing_day if needed
            const updates: Record<string, unknown> = {};
            if (!fuzzyMatch.card_identifier) updates.card_identifier = cardIdentifier;
            if (diaCierre && !fuzzyMatch.closing_day) updates.closing_day = diaCierre;
            if (Object.keys(updates).length > 0) {
              await supabase.from("credit_cards").update(updates).eq("id", fuzzyMatch.id);
            }
          } else {
            // Step 3: Create new card
            console.log("[parse-statement] No fuzzy match, creating new card");
            const cardName = [network, banco, numeroCuenta ? `****${numeroCuenta}` : ""]
              .filter(Boolean)
              .join(" ");

            const { data: newCard, error: cardError } = await supabase
              .from("credit_cards")
              .insert({
                user_id,
                workspace_id,
                name: cardName || "Tarjeta importada",
                bank: banco || null,
                card_network: network || null,
                account_number: numeroCuenta || null,
                card_identifier: cardIdentifier,
                closing_day: diaCierre,
              })
              .select("id, name, bank, card_network, account_number, closing_day")
              .single();

            if (cardError) {
              console.error("[parse-statement] Failed to create card:", cardError);
            } else if (newCard) {
              console.log("[parse-statement] Created new card:", newCard.id);
              resolvedCardId = newCard.id;
              detectedCard = { ...newCard, is_new: true };
            }
          }
        }
      } else if (resolvedCardId) {
        // Card was provided, but update its metadata if missing
        const { data: existingCard } = await supabase
          .from("credit_cards")
          .select("id, name, bank, card_network, account_number, closing_day")
          .eq("id", resolvedCardId)
          .single();

        if (existingCard) {
          const updates: Record<string, unknown> = {};
          if (!existingCard.card_network && network) updates.card_network = network;
          if (!existingCard.account_number && numeroCuenta) updates.account_number = numeroCuenta;
          if (!existingCard.bank && banco) updates.bank = banco;
          if (!existingCard.closing_day && diaCierre) updates.closing_day = diaCierre;
          if (cardIdentifier) updates.card_identifier = cardIdentifier;

          if (Object.keys(updates).length > 0) {
            await supabase.from("credit_cards").update(updates).eq("id", resolvedCardId);
          }
          detectedCard = { ...existingCard, ...updates, is_new: false } as typeof detectedCard;
        }
      }
    }

    // Update statement_imports record if ID provided
    if (statement_import_id) {
      const updatePayload: Record<string, unknown> = {
        status: "completed",
        extracted_data: extractedData,
      };
      if (resolvedCardId) {
        updatePayload.credit_card_id = resolvedCardId;
      }

      const { error: updateError } = await supabase
        .from("statement_imports")
        .update(updatePayload)
        .eq("id", statement_import_id);

      if (updateError) {
        console.error("[parse-statement] Failed to update import record:", updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData,
        total_items: totalItems,
        credit_card_id: resolvedCardId,
        detected_card: detectedCard,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[parse-statement] Error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
