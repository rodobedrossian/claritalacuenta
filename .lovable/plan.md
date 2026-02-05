
# Plan: Desplegar Edge Function `parse-voice-transaction`

## Diagnóstico

El envío de voz para generar transacciones está fallando porque:

| Paso | Estado | Detalle |
|------|--------|---------|
| ✅ Grabación de audio | OK | El micrófono funciona correctamente |
| ✅ WebSocket a ElevenLabs | OK | Conexión exitosa, transcripción recibida |
| ✅ Token scribe | OK | Se obtiene sin problemas |
| ❌ `parse-voice-transaction` | **No desplegada** | Devuelve 404 NOT_FOUND |

El flujo es:
1. Usuario graba voz → ElevenLabs transcribe "Agregame una transacción de 5000 pesos"
2. App envía texto a `parse-voice-transaction` para extraer monto, categoría, etc.
3. **La función no está desplegada** → 404 → Error CORS/Fetch

## Solución

1. **Desplegar la función `parse-voice-transaction`**
   - El código ya existe y está correcto
   - Tiene los CORS headers apropiados
   - Está configurada en `config.toml`
   - Solo falta ejecutar el deploy

2. **Verificar que funciona** después del despliegue

## Cambios técnicos

- Sin cambios de código, la función ya está lista
- Solo deploy de `parse-voice-transaction`

## Impacto esperado

Después del despliegue:
- La grabación de voz procesará correctamente el texto
- El usuario verá el modal de confirmación con los datos extraídos
- Podrá guardar la transacción exitosamente
