

## Fix: Excluir la categoría "Tarjeta" de los consumos de tarjeta de crédito

### Problema
La función `get-spending-by-weekday` ya filtra correctamente las transacciones normales (tabla `transactions`) excluyendo la categoría "Tarjeta". Sin embargo, las transacciones de tarjeta de crédito (`credit_card_transactions`) no aplican el mismo filtro. Algunos consumos o cuotas tienen `category_id` apuntando a la categoría "Tarjeta", lo que provoca que "Tarjeta" aparezca como categoría de gasto en el detalle.

### Solución
Filtrar las transacciones de tarjeta de crédito (`consumos` y `firstCuotas`) para excluir aquellas cuyo `category_id` pertenezca a la categoría "Tarjeta", de la misma forma que ya se hace con las transacciones normales.

### Cambio técnico

**Archivo:** `supabase/functions/get-spending-by-weekday/index.ts`

En la sección donde se procesan los `ccTransactionsResult` (linea 179-197), filtrar los registros cuyo `category_id` esté en el set `tarjetaCatIds` antes de procesarlos. Alternativamente, aplicar el filtro directamente en las queries de `consumos` y `firstCuotas` usando `.not('category_id', 'in', ...)` para cada ID de la categoría "Tarjeta".

La forma más simple y robusta: filtrar el array `data` resultante antes de retornarlo, igual que se hace con `transactionsResult`:

```text
// Línea ~135, cambiar:
const data = [...(consumos.data || []), ...(firstCuotas.data || [])];

// A:
const data = [...(consumos.data || []), ...(firstCuotas.data || [])]
  .filter((t) => !t.category_id || !tarjetaCatIds.has(t.category_id));
```

Esto garantiza que ninguna transacción categorizada como "Tarjeta" se cuente en el análisis de gastos por día, sin importar si viene de la tabla `transactions` o `credit_card_transactions`.

