
## Plan: Mejorar UX de Importación con Mensajes de Progreso

### Contexto
El procesamiento tarda ~2 minutos debido al modelo `gemini-2.5-pro` (necesario para precisión en tablas). La conciliación no afecta el tiempo - es cálculo instantáneo post-IA.

### Implementación

#### Archivo: `src/components/credit-cards/ImportStatementDialog.tsx`

**1. Agregar estados y constantes:**
```typescript
const PROGRESS_MESSAGES = [
  "Subiendo archivo...",
  "Analizando estructura del PDF...",
  "Identificando consumos y cuotas...",
  "Extrayendo montos e impuestos...",
  "Validando totales...",
  "Casi listo...",
];

const [progressIndex, setProgressIndex] = useState(0);
```

**2. useEffect para rotar mensajes cada 15 segundos:**
```typescript
useEffect(() => {
  if (uploading || parsing) {
    const interval = setInterval(() => {
      setProgressIndex((prev) => 
        prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 15000);
    return () => clearInterval(interval);
  } else {
    setProgressIndex(0);
  }
}, [uploading, parsing]);
```

**3. Reemplazar el botón de análisis (líneas 336-350):**

Cuando está procesando, mostrar:
- Barra de progreso indeterminada animada
- Mensaje de progreso que cambia cada 15s
- Texto "El análisis puede tomar 1-2 minutos"
- Tip "No cierres esta ventana"

```tsx
{(uploading || parsing) ? (
  <div className="space-y-4 py-2">
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      <div className="h-full w-2/5 bg-primary animate-progress-indeterminate" />
    </div>
    <div className="text-center space-y-1">
      <p className="text-sm font-medium">{PROGRESS_MESSAGES[progressIndex]}</p>
      <p className="text-xs text-muted-foreground">
        El análisis puede tomar 1-2 minutos
      </p>
    </div>
    <p className="text-xs text-center text-muted-foreground/70">
      No cierres esta ventana
    </p>
  </div>
) : (
  <Button onClick={handleAnalyzeAndCheck} disabled={!selectedFile || !selectedCardId}>
    Analizar resumen
  </Button>
)}
```

#### Archivo: `src/index.css`

Agregar animación de progreso indeterminado:
```css
@keyframes progress-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}

.animate-progress-indeterminate {
  animation: progress-indeterminate 1.5s ease-in-out infinite;
}
```

---

### Resultado Visual

**Antes:**
- Botón con spinner genérico "Analizando..."

**Después:**
- Barra de progreso animada
- "Analizando estructura del PDF..." → "Identificando consumos..." → etc.
- "El análisis puede tomar 1-2 minutos"
- "No cierres esta ventana"

---

### Impacto
- **Archivos**: 2 (`ImportStatementDialog.tsx`, `index.css`)
- **Riesgo**: Muy bajo - solo cambios de UI
- **La conciliación se mantiene** - no afecta el tiempo

### Fase 2 (Futuro - Si es necesario)
Procesamiento en background con polling a `statement_imports.status` para no bloquear al usuario. Requiere más cambios pero permite cerrar el dialog.
