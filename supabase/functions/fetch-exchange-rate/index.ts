import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching exchange rate from DolarApi...');
    
    // Llamar a la API de DolarApi
    const response = await fetch('https://dolarapi.com/v1/dolares/cripto');
    
    if (!response.ok) {
      throw new Error(`DolarApi returned status ${response.status}`);
    }

    const data = await response.json();
    console.log('DolarApi response:', data);

    // Extraer el valor de COMPRA
    const rate = data.compra;
    
    if (!rate || typeof rate !== 'number') {
      throw new Error('Invalid rate from API');
    }

    // Conectar a Supabase con service role para actualizar
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener el ID del registro actual (asumimos que solo hay uno)
    const { data: existingRate } = await supabase
      .from('exchange_rates')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (existingRate) {
      // Actualizar el registro existente
      const { error: updateError } = await supabase
        .from('exchange_rates')
        .update({ 
          rate, 
          updated_at: new Date().toISOString(),
          source: 'dolarapi_cripto'
        })
        .eq('id', existingRate.id);

      if (updateError) throw updateError;
      console.log('Exchange rate updated:', rate);
    } else {
      // Insertar nuevo registro si no existe
      const { error: insertError } = await supabase
        .from('exchange_rates')
        .insert({ rate, source: 'dolarapi_cripto' });

      if (insertError) throw insertError;
      console.log('Exchange rate inserted:', rate);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        rate,
        updated_at: new Date().toISOString(),
        source: 'dolarapi_cripto'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
