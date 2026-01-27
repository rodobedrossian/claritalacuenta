
# Plan: Landing Page SUPER COOL para Clarita la cuenta

## 🎯 Objetivo
Crear una landing page impactante, "Instagrameable", que muestre las capacidades de la app de forma visual y atractiva. Dirigida a millennials, Gen Z y adultos tech-savvy.

---

## 📐 Estructura de la Landing Page

### Sección 1: Hero Principal (Full-screen)
**Concepto:** Impacto visual inmediato con gradiente Stripe-style y animaciones suaves

- **Fondo:** Gradiente decorativo animado (rosa → violeta → azul pastel)
- **Logo + Nombre:** "Clarita la cuenta" con icono de wallet
- **Headline principal:** "Tus finanzas, claras y simples"
- **Subheadline:** "Registrá ingresos, gastos y ahorros en pesos y dólares. Sin complicaciones."
- **CTA principal:** Botón "Empezar gratis" con gradient-primary
- **Preview flotante:** Mockup del dashboard con sombras elegantes y animación de entrada
- **Elementos decorativos:** Orbs de color animados en el fondo

### Sección 2: Features Showcase (Scroll interactivo)
**Concepto:** Cards flotantes con micro-animaciones mostrando features clave

**Feature 1: Registro Rápido de Transacciones**
- Mockup del wizard de 3 pasos (Amount → Category → Details)
- Keypad numérico visual
- Badge "Manual o por voz"

**Feature 2: Registro por Voz**
- Mockup de la interfaz de grabación con orb Siri-style
- Texto animado como si estuviera transcribiendo
- Visualización de ondas de audio

**Feature 3: Dashboard de Balance**
- Mockup de stats cards (Ingresos/Gastos/Ahorros)
- Donut chart de gastos por categoría
- Balance neto prominente

**Feature 4: Carga de Resúmenes de TC**
- Mockup del flujo de importar PDF
- Preview de transacciones parseadas
- Badge "IA analiza tu resumen"

### Sección 3: Analytics & Insights
**Concepto:** Visualización de datos con charts interactivos

- Donut chart animado de categorías
- Insight card con sugerencias AI
- Proyección de cuotas de tarjeta
- Budget progress bars

### Sección 4: Multi-moneda
**Concepto:** Mostrar el soporte USD/ARS

- Toggle visual USD ↔ ARS
- Cotización en tiempo real
- Consolidación de patrimonio

### Sección 5: Savings & Investments
**Concepto:** Metas de ahorro e inversiones

- Progress bars de objetivos
- Cards de inversiones con rendimiento
- Patrimonio total consolidado

### Sección 6: Social Proof / Testimonials (Opcional)
**Concepto:** Frases de usuarios ficticios

- 3 cards con quotes y avatares
- Rating con estrellas

### Sección 7: Footer CTA
**Concepto:** Llamada final a la acción

- Headline: "¿Listo para tener claridad financiera?"
- CTA: "Crear cuenta gratis"
- Links secundarios: Privacy, Terms

---

## 🎨 Sistema de Diseño

### Colores
- **Fondo:** Blanco con gradiente decorativo pastel sutil
- **Primary:** Índigo (250 84% 54%)
- **Accents:** Gradientes vibrantes para CTAs
- **Cards:** Blanco con shadow-stripe

### Tipografía
- **Headings:** Font-black, tracking-tight
- **Body:** Font-medium, text-muted-foreground

### Animaciones
- **Entrada:** fade-in + slide-up con framer-motion
- **Scroll:** Parallax suave en elementos decorativos
- **Hover:** scale-up + shadow-increase en cards
- **Interactivas:** Orbs pulsantes, charts animados

---

## 🔧 Implementación Técnica

### Nuevo archivo: `src/pages/Landing.tsx`
Página completamente nueva, sin autenticación requerida

### Componentes a crear:

1. **`src/components/landing/HeroSection.tsx`**
   - Background con gradient animado
   - Headline + CTA
   - Mockup del dashboard flotante

2. **`src/components/landing/FeatureShowcase.tsx`**
   - Grid responsive de feature cards
   - Mockups interactivos

3. **`src/components/landing/VoiceFeatureDemo.tsx`**
   - Orb Siri-style animado
   - Texto que aparece letra por letra
   - Waveform visual

4. **`src/components/landing/DashboardPreview.tsx`**
   - Stat cards miniatura
   - Chart donut animado
   - Balance display

5. **`src/components/landing/TransactionWizardDemo.tsx`**
   - Keypad visual
   - Grid de categorías
   - Preview de transacción

6. **`src/components/landing/StatementImportDemo.tsx`**
   - Upload zone visual
   - Lista de transacciones parseadas
   - Badge de IA

7. **`src/components/landing/AnalyticsPreview.tsx`**
   - Charts con datos de ejemplo
   - Insight cards
   - Progress bars

8. **`src/components/landing/Footer.tsx`**
   - CTA final
   - Links legales

### Actualización de rutas: `src/App.tsx`
- Agregar ruta pública `/landing`
- Opcionalmente hacer que `/` redirija a `/landing` si no está autenticado

---

## 📱 Responsive Design

### Mobile (< 768px)
- Hero: Mockup debajo del texto
- Features: Stack vertical, cards full-width
- CTAs: Full-width buttons

### Tablet (768px - 1024px)
- Hero: Lado a lado con mockup más pequeño
- Features: Grid 2 columnas

### Desktop (> 1024px)
- Hero: Layout dividido 50/50
- Features: Grid 3-4 columnas
- Animaciones parallax más prominentes

---

## ✨ Elementos "Instagrameables"

1. **Orbs de color animados** flotando en el background
2. **Glassmorphism** en cards sobre gradientes
3. **Gradientes vibrantes** en CTAs y elementos destacados
4. **Animaciones suaves** en scroll (IntersectionObserver)
5. **Mockups realistas** con sombras elegantes
6. **Tipografía grande y bold** para headlines
7. **Micro-interacciones** en hover
8. **Transiciones smooth** entre secciones

---

## 📁 Archivos a Crear/Modificar

### Nuevos archivos:
1. `src/pages/Landing.tsx` - Página principal
2. `src/components/landing/HeroSection.tsx`
3. `src/components/landing/FeatureCard.tsx`
4. `src/components/landing/VoiceDemo.tsx`
5. `src/components/landing/DashboardMockup.tsx`
6. `src/components/landing/WizardMockup.tsx`
7. `src/components/landing/AnalyticsMockup.tsx`
8. `src/components/landing/FooterCTA.tsx`
9. `src/components/landing/FloatingOrbs.tsx`

### Archivos a modificar:
1. `src/App.tsx` - Agregar ruta `/landing`

---

## 🔄 Flujo de Usuario

```text
Usuario visita /landing
       ↓
   Hero con CTA
       ↓
   Scroll → Features animadas
       ↓
   Scroll → Analytics preview
       ↓
   Scroll → Multi-moneda + Savings
       ↓
   Footer CTA → "Crear cuenta"
       ↓
   Redirect a /auth
```

---

## 📝 Textos Clave

**Hero:**
- H1: "Tus finanzas, claras y simples"
- Subtitle: "Registrá ingresos, gastos y ahorros en pesos y dólares. Todo en un solo lugar, sin complicaciones."

**Features:**
- "Registrá en segundos" - Manual o por voz, siempre rápido
- "Hablale a Clarita" - Dictá tus gastos y listo
- "Importá tus resúmenes" - La IA analiza tu PDF de tarjeta
- "Entendé tus gastos" - Charts claros y presupuestos automáticos
- "Ahorrá en pesos y dólares" - Metas, inversiones, patrimonio

**Footer:**
- H2: "¿Listo para tener claridad financiera?"
- CTA: "Empezar gratis"

---

## ⏱️ Tiempo Estimado de Implementación

1. HeroSection + FloatingOrbs: ~30%
2. FeatureCards + Mockups: ~35%
3. AnalyticsMockup + VoiceDemo: ~20%
4. Footer + Responsive + Polish: ~15%

---

## 🎬 Detalles de Animaciones

**FloatingOrbs:**
```tsx
<motion.div
  animate={{
    x: [0, 50, 0],
    y: [0, -30, 0],
    scale: [1, 1.1, 1],
  }}
  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
/>
```

**Feature Cards on Scroll:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: "easeOut" }}
/>
```

**Voice Typewriter Effect:**
```tsx
{text.split('').map((char, i) => (
  <motion.span
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: i * 0.05 }}
  />
))}
```
