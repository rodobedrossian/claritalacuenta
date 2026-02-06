
# Plan: Excluir ajustes del Pie Chart de Categorías

## Problema identificado

Los **ajustes** son transacciones con montos **negativos** (ej: devoluciones, bonificaciones) que cuando se incluyen en el cálculo del pie chart:

1. Reducen artificialmente el total de una categoría
2. Generan porcentajes incorrectos (ej: 150%, -20%)
3. Pueden crear valores negativos que **rompen el pie chart** (Recharts no puede renderizar sectores negativos)

## Solución

Excluir transacciones con `transaction_type === "ajuste"` **solo** de los datos que van al pie chart de categorías. 

**NO afectar:**
- ✅ Lista de transacciones (ajustes siguen visibles)
- ✅ Totales del resumen (totalArs/totalUsd siguen incluyendo ajustes)
- ✅ Gráfico de barras por tarjeta (puede manejar valores mixtos)

## Cambios técnicos

### 1. StatementDetail.tsx

Modificar `chartItems` para excluir ajustes:

```typescript
const chartItems = useMemo(() => {
  return transactions
    .filter(tx => tx.transaction_type !== "ajuste")
    .map(tx => ({
      descripcion: tx.description,
      monto: tx.amount,
      moneda: tx.currency,
    }));
}, [transactions]);
```

Modificar `itemCategories` para solo mapear transacciones que van al chart:

```typescript
const itemCategories = useMemo(() => {
  const map: Record<string, string> = {};
  transactions
    .filter(tx => tx.transaction_type !== "ajuste")
    .forEach((tx) => {
      if (tx.category_id) {
        map[tx.description] = tx.category_id;
      }
    });
  return map;
}, [transactions]);
```

### 2. MonthlyAnalyticsChart.tsx

Modificar `categoryData` para excluir ajustes del pie chart:

```typescript
const categoryData = useMemo(() => {
  const data = new Map<string, number>();

  transactions
    .filter((t) => t.currency === currency && t.transaction_type !== "ajuste")
    .forEach((t) => {
      // ... resto igual
    });

  // ... resto igual
}, [transactions, currency, categoryMap]);
```

**El `cardData` NO se modifica** - el gráfico de barras puede manejar valores mixtos correctamente.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/credit-cards/StatementDetail.tsx` | Filtrar `chartItems` e `itemCategories` |
| `src/components/credit-cards/MonthlyAnalyticsChart.tsx` | Filtrar `categoryData` solamente |

## Resultado

- El pie chart mostrará solo gastos reales (consumos, cuotas, impuestos)
- Los porcentajes serán precisos y sumarán 100%
- Los ajustes siguen visibles en la lista y contando para el balance total
- El gráfico de barras por tarjeta no cambia
