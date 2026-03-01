

## Plan: Clarita Chat — Agent con Tools

### Arquitectura

```text
User types question
       │
       ▼
  React Chat UI ──POST (streaming)──▶ Edge Function "financial-chat"
  (/chat page)                          │
                                        ├─ Auth user, resolve workspace_id
                                        ├─ Build system prompt (rules, format)
                                        ├─ Define tools for the AI:
                                        │   • query_transactions(filters)
                                        │   • query_credit_card_transactions(filters)
                                        │   • get_monthly_summary(months)
                                        │   • get_category_breakdown(month, type)
                                        │   • get_savings_status()
                                        │   • get_budgets_status()
                                        │   • get_exchange_rate()
                                        │   • render_chart(type, data, title)
                                        │   • render_kpi(label, value, delta)
                                        │   • render_table(headers, rows)
                                        │
                                        ├─ Call Lovable AI Gateway (streaming)
                                        │  Model: google/gemini-2.5-flash
                                        │
                                        ├─ When AI calls a tool:
                                        │   Execute query against Supabase
                                        │   Return result to AI
                                        │   AI continues reasoning
                                        │
                                        └─ Stream final response (text + viz blocks)
```

### Tools del Agent

| Tool | Qué hace | Parámetros |
|------|----------|------------|
| `query_transactions` | Busca transacciones con filtros | `date_from`, `date_to`, `category`, `currency`, `type`, `min_amount`, `max_amount`, `limit` |
| `query_credit_card_transactions` | Busca consumos de tarjeta | `date_from`, `date_to`, `category`, `currency`, `card_name`, `limit` |
| `get_monthly_summary` | Resumen mensual (ingresos, gastos, balance) | `months` (cuántos meses hacia atrás) |
| `get_category_breakdown` | Desglose por categoría de un período | `date_from`, `date_to`, `source` (cash/card/all) |
| `get_savings_status` | Estado actual de ahorros, metas, inversiones | ninguno |
| `get_budgets_status` | Presupuestos y % de avance | ninguno |
| `get_exchange_rate` | Tipo de cambio actual | ninguno |
| `render_chart` | Indica al frontend que renderice un gráfico | `chart_type` (pie/bar/line), `data`, `title` |
| `render_kpi` | Muestra un KPI grande | `label`, `value`, `change_percent`, `change_label` |
| `render_table` | Muestra una tabla de datos | `headers`, `rows`, `title` |

La diferencia clave: las tools de `render_*` no consultan datos, sino que le dicen al frontend qué visualización mostrar. El AI decide cuándo usarlas después de consultar datos.

### Flujo del tool-calling loop

El edge function implementa un **loop de tool-calling**: envía el mensaje al AI, si el AI responde con tool_calls, ejecuta las queries, devuelve los resultados al AI, y repite hasta que el AI responda con texto final. El texto final se streameará al cliente.

Para las visualizaciones, el AI inserta bloques JSON especiales en su respuesta de texto (`:::chart{...}:::`, `:::kpi{...}:::`, `:::table{...}:::`) que el frontend parsea y renderiza como componentes React.

### System Prompt (reglas clave)

- Idioma: español argentino
- Prohibido: recomendaciones de inversión, sugerir alquiler más barato, menos deporte, vender el auto
- Permitido: analizar tendencias, identificar categorías discrecionales crecientes, proyectar metas de ahorro
- Formato de moneda: ARS con Intl.NumberFormat, USD con $
- Cuando quiera mostrar un gráfico, usa el formato `:::chart{...}:::` con los datos ya procesados

### Componentes Frontend

1. **`src/pages/Chat.tsx`** — Página full-screen con AppLayout, lista de mensajes, input bar, sugerencias iniciales
2. **`src/hooks/useFinancialChat.ts`** — Hook que maneja el streaming SSE, parseo de tokens, estado de mensajes
3. **`src/components/chat/ChatMessage.tsx`** — Renderiza markdown (con `react-markdown`) y detecta bloques `:::chart`, `:::kpi`, `:::table` para renderizar componentes
4. **`src/components/chat/ChatPieChart.tsx`** — Pie chart con Recharts
5. **`src/components/chat/ChatBarChart.tsx`** — Bar chart con Recharts
6. **`src/components/chat/ChatLineChart.tsx`** — Line chart con Recharts
7. **`src/components/chat/ChatKPICard.tsx`** — Card de KPI grande
8. **`src/components/chat/ChatTable.tsx`** — Tabla de datos

### Edge Function: `supabase/functions/financial-chat/index.ts`

- Auth: extrae user del header Authorization
- Resuelve workspace_id via query a workspace_members
- Define las tools con sus schemas JSON
- Envía messages + tools al AI Gateway
- Loop: si la respuesta tiene tool_calls, ejecuta cada tool contra Supabase, acumula tool results, re-envía al AI
- Máximo 5 iteraciones del loop para evitar loops infinitos
- Streameá la respuesta final al cliente via SSE
- Maneja 429/402 con mensajes claros
- Log de AI usage en ai_usage_logs

### Navegación

- Nueva ruta `/chat` protegida en App.tsx
- Nuevo ítem "Clarita AI" con ícono `MessageCircle` en el menú de Más (src/pages/Mas.tsx)

### Dependencia nueva

- `react-markdown` para renderizar las respuestas de texto del AI

### Config

- Agregar `[functions.financial-chat]` con `verify_jwt = false` en config.toml

### Build error actual

El error de Deno constraint (`Could not find constraint '*'`) se debe a un conflicto en `deno.json`. Se resolverá revisando/limpiando los imports del deno.json de functions.

### Archivos a crear/editar

| Acción | Archivo |
|--------|---------|
| Crear | `supabase/functions/financial-chat/index.ts` |
| Crear | `src/pages/Chat.tsx` |
| Crear | `src/hooks/useFinancialChat.ts` |
| Crear | `src/components/chat/ChatMessage.tsx` |
| Crear | `src/components/chat/ChatPieChart.tsx` |
| Crear | `src/components/chat/ChatBarChart.tsx` |
| Crear | `src/components/chat/ChatLineChart.tsx` |
| Crear | `src/components/chat/ChatKPICard.tsx` |
| Crear | `src/components/chat/ChatTable.tsx` |
| Editar | `src/App.tsx` (agregar ruta /chat) |
| Editar | `src/pages/Mas.tsx` (agregar menú Clarita AI) |
| Editar | `supabase/functions/deno.json` (fix constraint error) |

