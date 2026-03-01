

## Plan: Normalizar categorías a UUIDs en toda la aplicación

### Situación actual

**Datos en la DB:**
- `transactions.category`: 218 de 258 registros usan texto ("Salidas", "Supermercado"), solo 40 usan UUIDs
- `budgets.category`: 8 registros, todos con texto
- `recurring_expenses.category`: 12 registros, todos con texto (incluido "Rent" que no tiene match en categories)
- `credit_card_transactions.category_id`: ya usa UUIDs correctamente

Todos los textos existentes (excepto "Rent") tienen un match exacto en la tabla `categories`.

**Frontend:** Todos los forms (CategoryStep, BudgetCategoryStep, AddRecurringExpense, EditTransaction, etc.) envían `cat.name` en lugar de `cat.id`.

**Edge functions:** `get-dashboard-data`, `get-transactions-data`, `financial-chat`, `get-spending-by-weekday` resuelven UUIDs a nombres al leer, pero comparan con campos que mezclan texto y UUIDs.

### Cambios

#### 1. Migración de datos existentes (SQL migration)

```sql
-- Transactions: convert text categories to UUIDs
UPDATE transactions t
SET category = c.id::text
FROM categories c
WHERE LOWER(c.name) = LOWER(t.category)
AND t.category !~ '^[0-9a-f]{8}-';

-- Budgets: same
UPDATE budgets b
SET category = c.id::text
FROM categories c
WHERE LOWER(c.name) = LOWER(b.category)
AND b.category !~ '^[0-9a-f]{8}-';

-- Recurring expenses: same (map "Rent" → "Alquiler" first)
UPDATE recurring_expenses SET category = 'Alquiler' WHERE category = 'Rent';
UPDATE recurring_expenses re
SET category = c.id::text
FROM categories c
WHERE LOWER(c.name) = LOWER(re.category)
AND re.category !~ '^[0-9a-f]{8}-';
```

#### 2. Frontend: Forms envían `cat.id` en vez de `cat.name`

| Archivo | Cambio |
|---------|--------|
| `src/components/transaction-wizard/CategoryStep.tsx` | `handleSelectCategory(cat.id)`, comparar con `cat.id` |
| `src/components/budgets/BudgetCategoryStep.tsx` | `handleSelectCategory(cat.id)`, comparar con `cat.id` |
| `src/components/budgets/AddBudgetDialog.tsx` | `value={cat.id}` en SelectItem |
| `src/components/budgets/AddBudgetWizard.tsx` | Comparar budgets existentes por `cat.id` |
| `src/components/recurring/AddRecurringExpenseDialog.tsx` | `value={cat.id}` en SelectItem |
| `src/components/recurring/EditRecurringExpenseDialog.tsx` | `value={cat.id}` en SelectItem |
| `src/components/EditTransactionDialog.tsx` | `value={cat.id}` en SelectItem |
| `src/components/AddTransactionDialog.tsx` | Resolver AI category match a `cat.id` |

#### 3. Frontend: Display resuelve UUID → nombre

Donde se muestra `transaction.category` o `budget.category`, se necesita resolver el UUID al nombre usando el array de categories que ya tenemos cargado. Archivos clave:

| Archivo | Cambio |
|---------|--------|
| `src/components/TransactionsList.tsx` | Resolver UUID a nombre para display |
| `src/components/budgets/BudgetsList.tsx` | Resolver budget.category UUID a nombre |
| `src/components/budgets/BudgetProgress.tsx` | Resolver en toasts y labels |
| `src/hooks/useBudgetsData.ts` | Comparar budget.category (UUID) con transaction.category (UUID) — ya funcionará |
| `src/components/SpendingChart.tsx` | Ya recibe datos pre-procesados del dashboard |

#### 4. Edge functions: Simplificar resolución

Con todo normalizado a UUIDs, las funciones se simplifican: siempre buscan en `categories` por ID y resuelven nombres solo para display. No más heurísticas "is this a UUID or text?".

| Función | Cambio |
|---------|--------|
| `get-dashboard-data` | `categoryMap.get(t.category)` siempre será un UUID lookup |
| `get-transactions-data` | Igual, simplificar lookup |
| `financial-chat` | Eliminar doble-path "UUID or text" en `resolveCategoryName` |
| `get-spending-by-weekday` | Mismo simplify |
| `check-budget-alerts` | Asegurar que compara UUIDs |
| `generate-insights` | Verificar que usa UUIDs |

#### 5. Filtros en Transactions page

`src/pages/Transactions.tsx` usa un filtro de categoría — debe enviar/comparar por UUID.

### Orden de implementación

1. Migración SQL (convertir datos existentes)
2. Frontend forms → enviar `cat.id`
3. Frontend display → resolver UUID → nombre
4. Edge functions → simplificar
5. Testing

### Archivos a crear/editar

| Acción | Archivo |
|--------|---------|
| Migration | SQL para normalizar transactions, budgets, recurring_expenses |
| Edit | `src/components/transaction-wizard/CategoryStep.tsx` |
| Edit | `src/components/budgets/BudgetCategoryStep.tsx` |
| Edit | `src/components/budgets/AddBudgetDialog.tsx` |
| Edit | `src/components/budgets/AddBudgetWizard.tsx` |
| Edit | `src/components/recurring/AddRecurringExpenseDialog.tsx` |
| Edit | `src/components/recurring/EditRecurringExpenseDialog.tsx` |
| Edit | `src/components/EditTransactionDialog.tsx` |
| Edit | `src/components/AddTransactionDialog.tsx` |
| Edit | `src/components/TransactionsList.tsx` |
| Edit | `src/components/budgets/BudgetsList.tsx` |
| Edit | `src/components/budgets/BudgetProgress.tsx` |
| Edit | `src/pages/Transactions.tsx` |
| Edit | `supabase/functions/get-dashboard-data/index.ts` |
| Edit | `supabase/functions/get-transactions-data/index.ts` |
| Edit | `supabase/functions/financial-chat/index.ts` |
| Edit | `supabase/functions/get-spending-by-weekday/index.ts` |

