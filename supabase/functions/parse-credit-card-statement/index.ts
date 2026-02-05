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

4. **AJUSTES / CRÉDITOS**: Líneas con signo negativo que NO son pagos del cliente (créditos a favor del tarjetahabiente).
   - Ejemplos reales: "CR.RG 5617 30% M 22.532,13-", "BONIFICACIÓN", "DEVOLUCIÓN", "NOTA DE CRÉDITO"
   - Mantener el monto NEGATIVO en el valor (ej: -22532.13)
   - NO clasificar como impuesto ni como consumo
   - Van en el array "ajustes"

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
- IGNORA: pagos anteriores, límites de crédito, tasas de interés, info institucional, avisos legales

Retorna un JSON válido con esta estructura exacta:
{
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

Si no encuentras consumos, cuotas, impuestos o ajustes, retorna arrays vacíos para esos campos. SOLO retorna el JSON, sin texto adicional.

TEXTO DEL RESUMEN:
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_path, statement_import_id } = await req.json();
    
    if (!file_path) {
      throw new Error("file_path is required");
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
        model: "google/gemini-2.5-pro",
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
        max_tokens: 8000,
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
    });

    // Update statement_imports record if ID provided
    if (statement_import_id) {
      const { error: updateError } = await supabase
        .from("statement_imports")
        .update({
          status: "completed",
          extracted_data: extractedData,
        })
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
