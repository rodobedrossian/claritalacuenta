
# Plan: Landing Alternativa con Estética Apple

## Filosofía de Diseño Apple

La estética de Apple se basa en principios claros que aplicaré en esta nueva landing:

### Principios Clave
1. **Espacio en blanco generoso** - El aire entre elementos es tan importante como el contenido
2. **Tipografía como protagonista** - Headlines enormes, weights extremos (thin/bold contrast)
3. **Animaciones sutiles y naturales** - Scroll-triggered, sin loops infinitos llamativos
4. **Imágenes/mockups de producto hero** - El producto es el centro visual
5. **Colores neutros con acentos mínimos** - Negro, blanco, grises con toques de color puntuales
6. **Secciones de altura completa** - Cada sección respira, ocupa viewport
7. **Sin gradientes coloridos ni orbs flotantes** - Limpieza visual total
8. **CTAs minimalistas** - Botones simples, links sutiles

---

## Estructura de la Nueva Landing

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVIGATION                               │
│  [Logo] Clarita                                        [Empezar] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                                                                  │
│                    Tus finanzas.                                 │
│                    Claras.                                       │
│                                                                  │
│                 [Mockup iPhone centrado]                         │
│                                                                  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│     Registrá gastos              Importá resúmenes               │
│     en segundos.                 automáticamente.                │
│                                                                  │
│     [Ilustración]                [Ilustración]                   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      Hablá. Registrá.                            │
│                                                                  │
│            "Gasté cuarenta mil en el super"                      │
│                                                                  │
│                    [Waveform minimalista]                        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                   Entendé tus gastos.                            │
│                   De un vistazo.                                 │
│                                                                  │
│                    [Chart elegante]                              │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    Empezá gratis.                                │
│                                                                  │
│                      [Botón →]                                   │
│                                                                  │
│            Disponible para iPhone y web.                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Crear

### 1. `src/pages/LandingApple.tsx`
Página principal que orquesta las secciones:
- Importa los componentes de sección
- Fondo blanco puro (sin gradientes)
- Smooth scroll nativo

### 2. `src/components/landing-apple/AppleNav.tsx`
Navegación sticky minimalista:
- Logo a la izquierda (solo texto "Clarita")
- Botón "Empezar" a la derecha
- Blur backdrop on scroll
- Altura: 56px

### 3. `src/components/landing-apple/AppleHero.tsx`
Sección hero de altura completa:
- Headline centrado: "Tus finanzas." / "Claras." (en dos líneas)
- Subtítulo mínimo en gris
- iPhone mockup centrado con shadow elegante
- Animación de fade-in al cargar

### 4. `src/components/landing-apple/ApplePhoneMockup.tsx`
Mockup de iPhone realista:
- Frame estilo iPhone 15 (bordes redondeados, notch)
- Dashboard simplificado adentro
- Sombra difusa grande
- Parallax sutil en scroll

### 5. `src/components/landing-apple/AppleFeatureGrid.tsx`
Grid de 2 features lado a lado:
- "Registrá gastos en segundos" + mini ilustración
- "Importá resúmenes automáticamente" + mini ilustración
- Apareción on scroll

### 6. `src/components/landing-apple/AppleVoiceSection.tsx`
Sección dedicada a voz:
- Headline: "Hablá. Registrá."
- Texto de ejemplo en quotes grandes
- Waveform estático minimalista (barras grises)
- Sin animación de loop

### 7. `src/components/landing-apple/AppleAnalyticsSection.tsx`
Sección de analytics:
- "Entendé tus gastos. De un vistazo."
- Chart de barras limpio, colores neutros con un acento
- Aparece con parallax suave

### 8. `src/components/landing-apple/AppleFooter.tsx`
Footer minimalista:
- CTA final: "Empezá gratis." + botón flecha
- Texto pequeño: "Disponible para iPhone y web."
- Links: Privacidad
- Copyright en gris claro

---

## Paleta de Colores Apple

| Elemento | Color |
|----------|-------|
| Background | `#FFFFFF` (blanco puro) |
| Texto primario | `#1D1D1F` (negro Apple) |
| Texto secundario | `#86868B` (gris medio) |
| Acento | `#0071E3` (azul Apple) |
| Bordes/sombras | `rgba(0,0,0,0.04)` |

---

## Tipografía

- **Headlines**: `font-semibold` o `font-bold`, tracking tight, sizes: 48px-72px
- **Body**: `font-normal`, 17px-21px
- **Captions**: `font-normal`, 12px-14px, color gris

---

## Animaciones

| Elemento | Animación |
|----------|-----------|
| Hero | Fade in + slide up suave (0.8s) |
| Features | Fade in on scroll (stagger 0.1s) |
| Phone | Parallax leve (translateY en scroll) |
| Charts | Grow bars on view |
| CTA | Hover scale 1.02 |

---

## Ruta

Agregar en `src/App.tsx`:
```tsx
import LandingApple from "./pages/LandingApple";
// ...
<Route path="/landing-apple" element={<LandingApple />} />
```

---

## Comparación Visual

| Aspecto | Landing Actual | Landing Apple |
|---------|----------------|---------------|
| Background | Gradient con orbs | Blanco puro |
| Colores | Purples, pinks, gradients | Negro, gris, azul acento |
| Animaciones | Loops infinitos, orbs flotantes | On-scroll, una vez |
| Densidad | Mucha información | Espaciado extremo |
| Typography | Bold colorido | Bold neutro |
| CTAs | Gradient buttons | Solid blue minimal |
| Mockups | Cards con sombras coloridas | iPhone realista |

---

## Archivos a Modificar/Crear

| Archivo | Acción |
|---------|--------|
| `src/pages/LandingApple.tsx` | Crear |
| `src/components/landing-apple/AppleNav.tsx` | Crear |
| `src/components/landing-apple/AppleHero.tsx` | Crear |
| `src/components/landing-apple/ApplePhoneMockup.tsx` | Crear |
| `src/components/landing-apple/AppleFeatureGrid.tsx` | Crear |
| `src/components/landing-apple/AppleVoiceSection.tsx` | Crear |
| `src/components/landing-apple/AppleAnalyticsSection.tsx` | Crear |
| `src/components/landing-apple/AppleFooter.tsx` | Crear |
| `src/App.tsx` | Agregar ruta `/landing-apple` |

---

## Resultado

Podrás comparar ambas versiones:
- **`/landing`** - Versión actual (Stripe-inspired, colorida)
- **`/landing-apple`** - Nueva versión (Apple-inspired, minimalista)

Esto te permitirá evaluar cuál funciona mejor para tu audiencia iOS antes de decidir cuál usar como principal.
