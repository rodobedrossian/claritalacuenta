import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXTRACTION_PROMPT = `Eres un experto en analizar resúmenes de tarjetas de crédito argentinas. Analiza el siguiente texto extraído de un PDF de resumen de tarjeta de crédito y extrae TODOS los consumos, cuotas e impuestos.

IMPORTANTE:
- Extrae TODOS los consumos del período actual
- Extrae TODAS las cuotas de compras en cuotas (formato "CUOTA X/Y")
- Extrae TODOS los impuestos, cargos administrativos y gastos bancarios
- Los montos pueden estar en ARS o USD (fijate la sección donde aparecen)
- Las fechas suelen estar en formato DD/MM o DD/MM/YYYY
- IGNORA: pagos anteriores, límites de crédito, tasas de interés, info institucional, avisos legales

Retorna un JSON válido con esta estructura exacta:
{
  "consumos": [
    {
      "fecha": "DD/MM/YYYY",
      "descripcion": "texto descriptivo",
      "monto": 12345.67,
      "moneda": "ARS" o "USD",
      "cuota_actual": null,
      "total_cuotas": null
    }
  ],
  "cuotas": [
    {
      "fecha": "DD/MM/YYYY",
      "descripcion": "texto descriptivo",
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

serve(async (req) => {
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
