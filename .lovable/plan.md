

## Plan: Gate de 2 meses para Insights (solo)

### Cambios

**1. Crear hook `useAccountAge`** (`src/hooks/useAccountAge.ts`)
- Usa `user.created_at` de `useAuth()` para calcular antigüedad
- Exporta `hasMinimumUsage` (>= 60 días) y `daysRemaining`

**2. Insights page (`src/pages/Insights.tsx`)**
- Si `!hasMinimumUsage`, mostrar estado bloqueado con mensaje "Los insights se desbloquean luego de 2 meses de uso" + días restantes
- No invocar el edge function

**3. `useInsightsData.ts`**
- Recibir un flag `enabled` adicional; si `!hasMinimumUsage`, no hacer la query

**4. Dashboard `InsightsCard` (`src/components/insights/InsightsCard.tsx`)**
- Si `!hasMinimumUsage`, no renderizar nada (return null)

**5. Dashboard `Index.tsx`**
- Pasar `hasMinimumUsage` para condicionar el fetch de insights y el render del card

El chat queda sin cambios, accesible siempre.

