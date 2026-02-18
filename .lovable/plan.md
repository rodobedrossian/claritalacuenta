

# Plan: Mejorar matching de tarjetas en parse-credit-card-statement

## Problema raiz

La funcion `parse-credit-card-statement` genera un `card_identifier` a partir de lo que el AI extrae (red, banco, numero_cuenta) y hace un match exacto. Si el AI devuelve variaciones ("Santander" vs "Santander Rio") o lee mal digitos ("1720" en vez de "8720"), se crean tarjetas duplicadas.

## Solucion propuesta

### 1. Fuzzy matching antes de crear tarjeta nueva

Cuando no hay match exacto por `card_identifier`, buscar tarjetas existentes en el workspace con criterios mas flexibles:

- Misma red (card_network)
- Banco similar (containment / normalizacion agresiva: quitar "rio", "argentina", "sa", "sau", etc.)
- Account number similar (distancia de Levenshtein <= 1 digito, o match parcial)

Si hay un candidato fuerte, usar esa tarjeta en vez de crear una nueva.

### 2. Normalizacion de nombres de banco

Crear una funcion `normalizeBank()` que canonice variaciones comunes:
- "Santander Rio" / "Santander Río" / "Banco Santander" -> "santander"
- "BBVA Frances" / "BBVA Argentina" -> "bbva"
- "Banco Galicia" / "Galicia" -> "galicia"
- Quitar palabras comunes: "banco", "rio", "río", "argentina", "sa", "sau", "s.a.", "s.a.u."

### 3. Log de confianza

Loguear cuando se hace fuzzy match vs exact match para monitorear la calidad.

## Cambios tecnicos

### Archivo: `supabase/functions/parse-credit-card-statement/index.ts`

**Agregar funcion `normalizeBank`:**

```typescript
function normalizeBank(bank: string): string {
  return bank
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/\b(banco|rio|argentina|sa|sau|s\.a\.?u?\.?)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}
```

**Modificar el bloque de card matching (lineas 381-430):**

Despues de fallar el match exacto por `card_identifier`, antes de crear una tarjeta nueva:

1. Buscar todas las tarjetas del workspace
2. Comparar con normalizacion agresiva de banco + misma red
3. Si el account_number difiere en solo 1 digito, considerar match
4. Si hay exactamente 1 candidato, usarlo
5. Solo crear tarjeta nueva si no hay ningun candidato

```
Flujo:
1. Match exacto por card_identifier -> usar tarjeta
2. Si no: buscar por red + banco normalizado + account_number similar -> usar tarjeta
3. Si no: crear tarjeta nueva
```

### Limpieza de datos actual

Ademas del fix en el codigo, sera necesario limpiar las tarjetas duplicadas manualmente:
- Reasignar las transacciones de "VISA Santander ****1720" y "VISA Santander Rio ****8720" a "VISA Santander ****8720"
- Actualizar los statement_imports correspondientes
- Eliminar las tarjetas duplicadas

Esto se hara via queries SQL despues de implementar el fix.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/parse-credit-card-statement/index.ts` | Agregar `normalizeBank()`, implementar fuzzy matching antes de crear tarjeta |

## Resultado esperado

- PDFs del mismo banco con variaciones de nombre no crean tarjetas duplicadas
- Errores de 1 digito en el numero de cuenta se detectan y matchean a tarjeta existente
- Solo se crean tarjetas genuinamente nuevas
- Logs claros de cuando se usa fuzzy vs exact match

