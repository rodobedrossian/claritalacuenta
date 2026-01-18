import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXTRACTION_PROMPT = `Eres un experto en analizar resúmenes de tarjetas de crédito argentinas. Analiza el siguiente PDF de resumen de tarjeta de crédito y extrae TODOS los consumos, cuotas e impuestos.

REGLAS CRÍTICAS PARA CLASIFICACIÓN:
1. **CUOTAS**: Cualquier compra que tenga formato "X/Y" o "CUOTA X DE Y" va SOLO en el array "cuotas". 
   - Ejemplos: "ZARA (1/3)", "MEGATLON (8/12)", "FRAVEGA CUOTA 2 DE 6"
   - IMPORTANTE: Si una línea tiene patrón de cuota, va ÚNICAMENTE en "cuotas", NUNCA en "consumos"
   - Extrae cuota_actual (el primer número) y total_cuotas (el segundo número)
   
2. **CONSUMOS**: SOLO compras que NO tienen ningún patrón de cuota
   - Son pagos en un solo pago, sin cuotas
   - cuota_actual y total_cuotas deben ser null
   
3. **IMPUESTOS**: IVA, percepciones, impuesto PAIS, sellados, cargos administrativos

IMPORTANTE - EVITAR DUPLICADOS:
- Una transacción va en UN SOLO array (consumos O cuotas O impuestos)
- Si tiene patrón (X/Y) → solo va en cuotas
- Si es un impuesto/cargo → solo va en impuestos
- Todo lo demás → solo va en consumos

DATOS A EXTRAER:
- Los montos pueden estar en ARS o USD (fijate la sección donde aparecen)
- Las fechas suelen estar en formato DD/MM o DD/MM/YYYY
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
      "descripcion": "texto descriptivo SIN el patrón de cuota",
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
  "resumen": {
    "total_ars": 0,
    "total_usd": 0,
    "fecha_vencimiento": "DD/MM/YYYY",
    "fecha_cierre": "DD/MM/YYYY"
  }
}

Si no encuentras consumos, retorna arrays vacíos. SOLO retorna el JSON, sin texto adicional.

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
        model: "google/gemini-2.5-flash",
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
    if (!extractedData.resumen) extractedData.resumen = {};

    const totalItems = extractedData.consumos.length + extractedData.cuotas.length + extractedData.impuestos.length;
    console.log("[parse-statement] Extracted:", {
      consumos: extractedData.consumos.length,
      cuotas: extractedData.cuotas.length,
      impuestos: extractedData.impuestos.length,
      total: totalItems,
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
