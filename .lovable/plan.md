
# Rediseno de Presupuestos: Estilo iOS Nativo

## Vision

Alinear la pagina de Presupuestos y el componente BudgetProgress del dashboard con la nueva estetica fintech iOS del hero card. Actualmente se ven como una tabla web generica y cards planas, lejos del look nativo.

## Cambios principales

### 1. Pagina /budgets - Hero summary con gradiente

Reemplazar las 3 summary cards planas y el header simple por un **hero card con gradiente** (mismo estilo que el dashboard), mostrando:

```text
+------------------------------------------+
|  [gradiente oscuro verde/esmeralda]      |
|  Presupuestos          [+ Agregar]       |
|  febrero 2026                            |
|                                          |
|  +----------+ +----------+ +----------+ |
|  | Presupu. | | Gastado  | | En riesgo| |
|  | $640K    | | $307K    | | 1        | |
|  +----------+ +----------+ +----------+ |
+------------------------------------------+
```

### 2. BudgetsTable - Lista nativa iOS en mobile

En mobile, reemplazar la tabla HTML (ilegible en pantallas chicas) por una **lista estilo iOS** con filas individuales que muestren:

```text
+------------------------------------------+
| [icon] Supermercado           ARS        |
|  ████████████░░░░  65%                   |
|  $162,000 / $250,000    Disp: $88,000    |
|                            [edit] [del]  |
+------------------------------------------+
```

- Cada fila como una card sutil con `rounded-2xl`, `border-border/30`
- Barra de progreso con colores semanticos (verde/amarillo/rojo)
- En desktop, mantener la tabla pero con bordes mas suaves

### 3. BudgetProgress (dashboard) - Refinamiento visual

Ajustar el componente del dashboard para consistencia:
- Remover la barra de progreso duplicada (actualmente hay un `<Progress>` y un `<div>` superpuestos)
- Usar solo la barra custom con colores semanticos
- Espaciado mas generoso entre items

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/Budgets.tsx` | Reemplazar header + summary cards por hero con gradiente. Ajustar layout general |
| `src/components/budgets/BudgetsTable.tsx` | Rediseno completo: lista nativa iOS en mobile, tabla refinada en desktop |
| `src/components/budgets/BudgetProgress.tsx` | Fix barra duplicada, ajustar espaciado y consistencia visual |

## Seccion tecnica

### Budgets.tsx - Hero section
- Usar el mismo gradiente del dashboard: `bg-gradient-to-br from-[hsl(152,55%,28%)] to-[hsl(165,50%,22%)]`
- Bordes inferiores redondeados `rounded-b-3xl`
- Mini-stats como pills semi-transparentes `bg-white/10 rounded-xl`
- Boton "Agregar" integrado en el hero como pill outline blanca
- Eliminar las 3 Card separadas y el header sticky

### BudgetsTable.tsx - Responsive
- Mobile (`md` breakpoint): renderizar como lista de cards individuales, cada una con la info compacta y barra de progreso
- Desktop: mantener Table pero con `rounded-2xl`, `border-border/30`, sin `gradient-card`
- Usar `useIsMobile()` hook para el switch

### BudgetProgress.tsx - Fix
- Linea 123-134: hay un `<Progress>` de shadcn y un `<div>` absoluto encima que genera doble barra
- Reemplazar por solo la barra custom (el div con color semantico) sobre un fondo `bg-muted` redondeado
