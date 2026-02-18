# Plan: Tracking de tokens y costos de AI

## Contexto

Hay 4 edge functions que llaman al AI gateway: `parse-credit-card-statement`, `auto-categorize-transactions`, `parse-voice-transaction`, y `transcribe-audio`. La funcion `generate-insights` NO usa AI (es analisis estadistico puro), asi que no tiene tokens para trackear.

Tener en cuenta: Esto no deberia causar ningun delay en la experiencia del usuario final, deberia pasar por detras sin generar ningun tiempo de espera por el guardado. 

## Solucion

### 1. Nueva tabla `ai_usage_logs`

Crear una tabla centralizada para registrar cada llamada a la AI gateway:

```
ai_usage_logs
- id (uuid, PK)
- user_id (uuid, NOT NULL)
- workspace_id (uuid, NOT NULL)
- function_name (text) -- ej: "parse-credit-card-statement"
- model (text) -- ej: "google/gemini-3-flash-preview"
- prompt_tokens (integer)
- completion_tokens (integer)
- total_tokens (integer)
- reference_id (uuid, nullable) -- statement_import_id u otro ID de referencia
- created_at (timestamptz, default now())
```

RLS: solo lectura via service role (las edge functions escriben con service role). Sin politicas para usuarios normales.

### 2. Modificar edge functions para guardar tokens

En cada funcion que llama al AI gateway, despues de recibir la respuesta, extraer `usage` del response y hacer un INSERT en `ai_usage_logs`:

```typescript
const usage = aiData.usage;
if (usage) {
  await supabase.from("ai_usage_logs").insert({
    user_id,
    workspace_id,
    function_name: "parse-credit-card-statement",
    model: "google/gemini-3-flash-preview",
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_tokens: usage.total_tokens,
    reference_id: statement_import_id,
  });
}
```

Funciones a modificar:

- `parse-credit-card-statement` (modelo: gemini-3-flash-preview)
- `auto-categorize-transactions` (modelo: gemini-2.5-flash-lite)
- `parse-voice-transaction`
- `transcribe-audio`

### 3. Nueva edge function `get-ai-usage-stats`

Edge function para el admin que devuelve:

- Total de tokens por funcion (agrupado)
- Total de tokens por usuario
- Detalle por dia/semana
- Costo estimado (basado en pricing del modelo)

### 4. Seccion en Admin Dashboard

Agregar una nueva card "Uso de AI" en el admin dashboard con:

- Tabla resumen: funcion, llamadas totales, tokens totales, costo estimado
- Desglose por usuario (quien consume mas)
- Filtro por rango de fechas
- Nota: `generate-insights` no aparece porque no usa AI

## Archivos a modificar


| Archivo                                                    | Cambio                                         |
| ---------------------------------------------------------- | ---------------------------------------------- |
| Nueva migracion SQL                                        | Crear tabla `ai_usage_logs`                    |
| `supabase/functions/parse-credit-card-statement/index.ts`  | Guardar usage tokens post-AI call              |
| `supabase/functions/auto-categorize-transactions/index.ts` | Guardar usage tokens post-AI call              |
| `supabase/functions/parse-voice-transaction/index.ts`      | Guardar usage tokens post-AI call              |
| `supabase/functions/transcribe-audio/index.ts`             | Guardar usage tokens post-AI call              |
| Nuevo: `supabase/functions/get-ai-usage-stats/index.ts`    | Edge function admin para consultar stats       |
| `src/pages/admin/AdminDashboard.tsx`                       | Nueva seccion "Uso de AI" con tabla y metricas |


## Nota sobre Insights

La funcion `generate-insights` es 100% estadistica (mediana, MAD, comparaciones mes a mes). No llama a ningun modelo de AI, por lo que no genera tokens ni costos. Solo las 4 funciones listadas arriba usan la AI gateway.