
# Plan: Re-deploy de Edge Functions faltantes

## Diagnóstico

Detecté que varias Edge Functions no están desplegadas en el backend:

| Function | Estado | Respuesta |
|----------|--------|-----------|
| `get-dashboard-data` | Funcionando | 200 OK |
| `get-transactions-data` | No desplegada | 404 NOT_FOUND |
| `get-savings-data` | No desplegada | 404 NOT_FOUND |
| `generate-insights` | No desplegada | 404 NOT_FOUND |
| `elevenlabs-scribe-token` | No desplegada | 404 NOT_FOUND |

Esto sucede porque los cambios al código solo actualizaron los archivos pero no se re-desplegaron las funciones. La configuración CORS en el código está correcta (ya tiene `Access-Control-Allow-Methods`), pero al no existir las funciones desplegadas, devuelven 404 y el navegador lo reporta como error CORS.

## Solución

1. **Re-desplegar todas las Edge Functions afectadas:**
   - `get-savings-data`
   - `get-transactions-data`
   - `generate-insights`
   - `elevenlabs-scribe-token`

2. **Verificar que funcionan correctamente** después del despliegue

3. **Hacer un hard refresh** en tu navegador para limpiar cache

## Cambios técnicos

- Sin cambios de código necesarios, las funciones ya tienen los CORS headers correctos
- Solo se necesita ejecutar el despliegue de las funciones existentes

## Impacto esperado

Después del despliegue:
- La pantalla de Ahorros cargará correctamente
- La pantalla de Transacciones funcionará
- Los Insights se generarán
- El grabador de voz obtendrá su token

## Tiempo estimado

5 minutos (despliegue automático)
