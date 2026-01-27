
# Plan: Mejorar la Sección de Analytics & Insights de la Landing Page

## Problema Actual
La sección actual de Analytics e Insights se ve "plain" y no refleja la riqueza visual de la plataforma real, que incluye:
- Proyecciones de cuotas con gráficos de barras horizontales
- Analytics mensuales con donut charts coloridos y totales multi-moneda
- Insights inteligentes con badges de prioridad, tipos y categorías

## Solución Propuesta

Vamos a crear una sección completamente rediseñada que sea visualmente impactante y muestre las 3 capacidades principales de analytics de la app de forma interactiva.

### Estructura Nueva

La sección será dividida en **3 sub-secciones** con mockups más ricos y animados:

---

## Sección 1: Analytics Mensuales (Nuevo Componente)

**Mockup tipo "MonthlyAnalytics"** que incluye:
- **Stats Row**: 4 cards con totales (ARS, USD, Transacciones, Tarjetas)
- **Donut Chart Animado**: Con leyenda de categorías y colores vibrantes
- **Bar Chart por Tarjeta**: Gasto por cada tarjeta de crédito

Colores vibrantes: Violeta, Verde, Naranja, Amarillo, Cyan, Rosa

---

## Sección 2: Proyección de Cuotas (Mejorar Actual)

**Mockup tipo "InstallmentProjection"** con:
- **3 Stat Cards destacados**: 
  - "Cuotas del próximo mes" - $567K
  - "En Mar 2026 liberás" - $138K (verde)
  - "En 6 meses baja" - $505K (-89% badge verde)
- **Gráfico de Barras Horizontales** animado mostrando la evolución mensual descendente

---

## Sección 3: Insights Inteligentes (Nuevo Componente)

**Mockup tipo "InsightsList"** que replica:
- Header "Análisis inteligente" con metadata
- Tabs de filtros (Todos, Anomalías, Patrones, Tendencias, Consejos)
- **3-4 Insight Cards** con:
  - Icono tipo/color
  - Badges de prioridad (ALTA en rojo, MEDIA en naranja)
  - Badge de tipo (ANOMALÍA, PATRÓN)
  - Badge de categoría (AUTO, SUPERMERCADO)
  - Título + descripción

---

## Diseño Visual

### Paleta de Colores para Charts
```text
- Violeta: hsl(250, 84%, 54%)
- Verde: hsl(142, 71%, 45%)
- Naranja: hsl(24, 95%, 53%)
- Amarillo: hsl(45, 93%, 47%)
- Cyan: hsl(188, 94%, 43%)
- Rosa: hsl(340, 82%, 52%)
- Azul: hsl(217, 91%, 60%)
```

### Animaciones
- Barras que crecen al scroll (whileInView)
- Donut que se dibuja con rotación
- Cards con fade-in staggered
- Badges con scale-in
- Números con contador animado (opcional)

---

## Archivos a Modificar/Crear

### 1. `src/components/landing/AnalyticsSection.tsx`
Rehacer completamente para ser un showcase más grande con las 3 sub-secciones

### 2. `src/components/landing/AnalyticsMockup.tsx`
Reemplazar con versión más rica:
- Donut chart SVG animado con framer-motion
- Stats cards estilo Stripe
- Lista de categorías con colores

### 3. `src/components/landing/InstallmentProjectionMockup.tsx` (NUEVO)
- 3 stat cards con proyecciones
- Gráfico de barras horizontales animadas
- Badge de % de reducción

### 4. `src/components/landing/InsightsMockup.tsx` (NUEVO)
- Header con contador de insights
- Tabs ficticios de filtros
- 3-4 Insight cards con badges y descripciones

---

## Estructura de la Sección Rediseñada

```text
┌──────────────────────────────────────────────────────────────┐
│  [Badge] Analytics e Insights                                │
│                                                              │
│  "Datos que te ayudan a tomar mejores decisiones"           │
│                                                              │
│  [Descripción]                                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  [Enero 2026]           ARS 5.4M  USD 133  160 txns    ││
│  │                                                         ││
│  │    ┌─────────┐    Vacaciones    $1.57M                 ││
│  │    │ Donut   │    Compras       $813K                  ││
│  │    │ Chart   │    Salidas       $746K                  ││
│  │    └─────────┘    Supermercado  $578K                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [Proyección de Cuotas]                                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐              │
│  │$567K     │  │$138K     │  │$505K  [-89%] │              │
│  │Próx.mes  │  │Liberás   │  │En 6 meses    │              │
│  └──────────┘  └──────────┘  └──────────────┘              │
│                                                              │
│  Ene 2026 ████████████████████████████████                  │
│  Feb 2026 ██████████████████████████████████████           │
│  Mar 2026 ████████████████████████                          │
│  Abr 2026 ████████████████                                  │
│  May 2026 ██████████                                        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [Insights Inteligentes]                                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ⚠️ [ALTA] [ANOMALÍA] [AUTO]                            ││
│  │ Auto: gasto inusual                                     ││
│  │ Más compras (+50%) y más caras (+93%)                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔄 [ALTA] [PATRÓN]                                      ││
│  │ Desglose de consumos TC: $3.28M                        ││
│  │ Supermercado 26%, Compras 23%, Auto 18%                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔄 [MEDIA] [PATRÓN] [SUPERMERCADO]                     ││
│  │ Jumbo Martinez es recurrente                           ││
│  │ 8 veces, promedio $147K cada vez                       ││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## Detalles Técnicos

### Donut Chart SVG Animado
```tsx
// Círculo con stroke-dasharray animado
<motion.circle
  cx="50" cy="50" r="40"
  stroke={color}
  strokeWidth="20"
  fill="transparent"
  strokeDasharray={`${percentage * 2.51} 251`}
  initial={{ strokeDasharray: "0 251" }}
  whileInView={{ strokeDasharray: `${percentage * 2.51} 251` }}
  transition={{ duration: 1, ease: "easeOut" }}
/>
```

### Barra Horizontal Animada
```tsx
<motion.div
  className="h-6 bg-primary rounded-r-lg"
  initial={{ width: 0 }}
  whileInView={{ width: `${percentage}%` }}
  transition={{ duration: 0.8, delay: index * 0.1 }}
/>
```

### Badge de Prioridad
```tsx
<Badge 
  className="bg-destructive/10 text-destructive text-[10px] uppercase font-bold"
>
  Alta
</Badge>
```

---

## Layout Responsivo

### Desktop (lg+)
- Grid de 2 columnas para cada sub-sección
- Texto a la izquierda, mockup a la derecha (alternando)

### Mobile
- Stack vertical
- Mockups a ancho completo
- Cards más compactas

---

## Resultado Esperado

Una sección que:
1. Muestre datos financieros reales y reconocibles
2. Use animaciones suaves que capturen la atención
3. Demuestre las 3 capacidades clave: Analytics, Proyecciones e Insights
4. Se sienta premium y "Instagrameable"
5. Refleje la experiencia real de usar la plataforma
