const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface ParsedTransaction {
  type: 'income' | 'expense';
  amount: number;
  currency: 'USD' | 'ARS';
  category: string;
  description: string;
  date: string;
  confidence: number;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text, categories, userName, users } = await req.json();
    
    if (!text) {
      throw new Error('No text provided');
    }

    console.log('Parsing transaction from text:', text);
    console.log('Available categories:', categories);
    console.log('Available users:', users);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const today = new Date().toISOString().split('T')[0];
    const categoryNames = categories?.map((c: any) => c.name).join(', ') || '';
    const userNames = users?.map((u: any) => u.name).join(', ') || '';

    const systemPrompt = `Eres un asistente que extrae datos de transacciones financieras de texto en español argentino.

Contexto:
- Usuario actual: ${userName || 'Usuario'}
- Usuarios disponibles: ${userNames}
- Categorías disponibles: ${categoryNames}
- Fecha actual: ${today}
- Moneda por defecto: ARS (pesos argentinos)
- Si mencionan "dólares", "dolares", "USD", "usd" o "verdes", usar USD

Reglas importantes:
1. El tipo es "expense" para gastos y "income" para ingresos
2. Buscar palabras clave: "gaste/gasté/pagué/compré/almorcé/cené/tomé" = expense, "cobré/recibí/me pagaron/vendí" = income
3. La categoría DEBE ser exactamente una de la lista proporcionada. Elegir la más cercana semánticamente si no hay match exacto:
   - Comida/almuerzo/cena/café/restaurante → buscar categoría de comida (Food, Comida, Alimentación, etc.)
   - Taxi/uber/colectivo/nafta → buscar categoría de transporte (Transportation, Transporte, etc.)
   - Luz/gas/agua/internet/teléfono → buscar categoría de servicios (Utilities, Servicios, etc.)
   - Salario/sueldo/honorarios → buscar categoría de ingresos (Salary, Sueldo, Ingreso, etc.)
4. Si no hay fecha específica, usar la fecha actual
5. Extraer el monto numérico (ej: "dos mil" = 2000, "quinientos" = 500, "quince lucas" = 15000)
6. Si mencionan un nombre de persona que coincide con los usuarios disponibles, ese es el owner

Debes retornar un JSON válido con esta estructura exacta:
{
  "type": "expense" | "income",
  "amount": number,
  "currency": "ARS" | "USD",
  "category": "nombre EXACTO de una categoria de la lista",
  "description": "descripcion breve del gasto/ingreso",
  "date": "YYYY-MM-DD",
  "owner": "nombre del usuario si se menciona",
  "confidence": 0.0 a 1.0,
  "notes": "cualquier ambiguedad o inferencia hecha"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extrae los datos de esta transacción: "${text}"` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_transaction',
              description: 'Extrae los datos estructurados de una transacción financiera',
              parameters: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['income', 'expense'] },
                  amount: { type: 'number' },
                  currency: { type: 'string', enum: ['USD', 'ARS'] },
                  category: { type: 'string' },
                  description: { type: 'string' },
                  date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                  owner: { type: 'string' },
                  confidence: { type: 'number', minimum: 0, maximum: 1 },
                  notes: { type: 'string' }
                },
                required: ['type', 'amount', 'currency', 'category', 'description', 'date', 'confidence'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_transaction' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Parse failed: ${errorText}`);
    }

    const result = await response.json();
    console.log('AI response:', JSON.stringify(result, null, 2));

    // Extract the function call result
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'extract_transaction') {
      // Fallback: try to parse from content
      const content = result.choices?.[0]?.message?.content;
      if (content) {
        // Try to extract JSON from content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify({ transaction: parsed }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      throw new Error('Could not extract transaction data');
    }

    const parsedTransaction = JSON.parse(toolCall.function.arguments);
    console.log('Parsed transaction:', parsedTransaction);

    return new Response(
      JSON.stringify({ transaction: parsedTransaction }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Parse error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
