

## Plan: Corregir el Matcheo de Descripciones y Montos en la Importación de Resúmenes

### Problema Identificado
La IA (Gemini) está desalineando las descripciones de consumos con sus montos correspondientes al parsear el PDF. Por ejemplo:
- **PDF original**: "APPYPF 00023 COMBUST" → $47.478,68
- **Resultado actual**: "APPYPF 00023 COMBUST" → $5.490

Esto ocurre porque la IA reconstruye las relaciones fila-columna de manera incorrecta en tablas densas con formato numérico argentino.

### Solución Propuesta

#### 1. Mejorar el Prompt de Extracción

Agregar instrucciones más explícitas sobre cómo parsear la estructura tabular:

- **Instrucciones de alineación**: Enfatizar que cada línea del resumen contiene fecha, descripción y monto en la MISMA fila
- **Formato numérico**: Clarificar que los números usan formato argentino (punto = miles, coma = decimales)
- **Validación de consistencia**: Instruir a la IA que verifique que los totales parciales coincidan con las sumas

#### 2. Agregar Post-Validación

Después de recibir la respuesta de la IA:
- Comparar la suma calculada de items con el total del resumen
- Si hay diferencia significativa (>1%), loggear advertencia para debug
- Mostrar alerta al usuario sobre posibles inconsistencias

---

### Cambios Técnicos

#### Archivo: `supabase/functions/parse-credit-card-statement/index.ts`

1. **Mejorar EXTRACTION_PROMPT** (líneas 11-105):

```text
Agregar sección de instrucciones de parseo tabular:

INSTRUCCIONES CRÍTICAS PARA PARSEO TABULAR:

1. CADA LÍNEA ES UNA TRANSACCIÓN COMPLETA:
   - Formato típico: [Línea] [Fecha] [Descripción] [Monto]
   - El monto SIEMPRE está al final de la línea, alineado a la derecha
   - La descripción está en el medio, entre la fecha y el monto
   - NUNCA mezcles montos de una línea con descripciones de otra

2. FORMATO NUMÉRICO ARGENTINO:
   - Separador de miles: punto (.)
   - Separador de decimales: coma (,)
   - Ejemplo: "47.478,68" = cuarenta y siete mil cuatrocientos setenta y ocho con 68 centavos
   - Ejemplo: "5.490" = cinco mil cuatrocientos noventa (SIN decimales)
   - "1.234.567,89" = un millón doscientos...

3. VERIFICACIÓN DE ALINEACIÓN:
   - Antes de retornar, verifica que cada descripción tenga su monto correcto
   - Si la línea dice "APPYPF 00023 COMBUST" seguido de "47.478,68", 
     el monto debe ser 47478.68, NO otro valor de otra línea

4. PISTAS VISUALES:
   - Los montos suelen estar alineados verticalmente en una columna derecha
   - Las fechas están en formato DD/MM/YYYY o similar
   - Las descripciones varían en longitud
```

2. **Agregar logging mejorado** para debugging:
   - Loggear el raw response de la IA para análisis
   - Incluir más detalles en la reconciliación

3. **Considerar modelo alternativo**:
   - Probar `google/gemini-2.5-pro` en lugar de `flash` para mejor precisión en parsing tabular
   - El modelo Pro tiene mejor capacidad de reasoning para tablas complejas

---

### Impacto

- **Archivos modificados**: 1 (`supabase/functions/parse-credit-card-statement/index.ts`)
- **Riesgo**: Bajo - cambios en prompt no afectan estructura de datos
- **Testing**: Reimportar el mismo PDF después del cambio para verificar

