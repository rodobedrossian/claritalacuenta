
## Plan: Simplificar UI de Procesamiento con Icono de IA

### Objetivo
Cuando el PDF está siendo analizado, ocultar todo el formulario (selectores de tarjeta, mes, archivo) y mostrar solo una vista limpia y centrada con:
- Icono de "magia/AI" (Sparkles de Lucide)
- Barra de progreso animada
- Mensaje de progreso que rota

### Cambios Técnicos

#### Archivo: `src/components/credit-cards/ImportStatementDialog.tsx`

**1. Importar icono Sparkles:**
```typescript
import { Sparkles } from "lucide-react";
```

**2. Modificar el step "upload" para ocultar el formulario durante el procesamiento:**

En lugar de mostrar siempre el formulario completo, cuando `uploading || parsing` es true, mostrar solo la vista de progreso centrada:

```tsx
{step === "upload" && (
  <div className="space-y-4 py-4">
    {(uploading || parsing) ? (
      // Vista minimalista de procesamiento
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="relative">
          <Sparkles className="h-12 w-12 text-primary animate-pulse" />
        </div>
        <div className="w-full max-w-xs space-y-4">
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div className="h-full w-2/5 bg-primary animate-progress-indeterminate" />
          </div>
          <p className="text-sm font-medium text-center">
            {PROGRESS_MESSAGES[progressIndex]}
          </p>
        </div>
      </div>
    ) : (
      // Formulario normal (selector de tarjeta, mes, archivo PDF)
      <>
        {/* ... contenido actual del formulario ... */}
        <Button onClick={handleAnalyzeAndCheck} ...>
          Analizar resumen
        </Button>
      </>
    )}
  </div>
)}
```

### Resultado Visual

**Antes:**
- Se ve todo el formulario + barra de progreso abajo
- Tres textos: mensaje, tiempo estimado, "no cierres"

**Después:**
- Solo se ve:
  - ✨ Icono Sparkles animado (pulse)
  - Barra de progreso indeterminada
  - Un único mensaje que rota
- Sin distracciones, foco total en la espera

### Impacto
- **Archivo modificado**: 1 (`ImportStatementDialog.tsx`)
- **Riesgo**: Muy bajo - solo cambios de UI
