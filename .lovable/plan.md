

# Landing Page Gen Z: "Ruculin te explica"

## Concepto

Una landing page disruptiva y divertida que rompe con la estetica fintech corporativa. Ruculin, la mascota de Rucula, es un personaje con actitud que desmitifica las finanzas usando humor de redes sociales (girl math, "es plata del futuro", "si esta en cuotas no cuenta"). El tono es irreverente pero educativo: cada chiste lleva a una feature real de la app.

## Estructura de secciones

```text
1. HERO - "Girl math dice que si no lo anotaste, no lo gastaste"
   Ruculin con actitud, CTA principal, fondo con stickers/graffiti sutil

2. GIRL MATH CAROUSEL - 3 cards con "girl math vs reality"
   Cada una muestra un mito ironico y como Rucula lo resuelve

3. RUCULIN EXPLICA - Mascota con speech bubbles
   Explica features clave con frases cortas y onda

4. FEATURES RAPIDAS - Grid minimalista con iconos
   Lo que hace la app en 6 bullets visuales

5. SOCIAL PROOF / VIBE CHECK - Frases tipo reviews ficticias
   Estilo tweets/stories con humor

6. CTA FINAL - "Dale, animate. Es gratis."
   Boton grande, Ruculin despidiendose
```

## Ruculin - El personaje

Ruculin se construye con CSS/SVG inline (sin necesidad de assets externos):
- Un circulo verde (la hoja de rucula estilizada) con ojos expresivos y una sonrisa
- Diferentes poses/expresiones segun la seccion (pensando, sorprendido, guino)
- Speech bubbles con bordes redondeados estilo comic
- Se implementa como componente React reutilizable con prop `mood`

## Girl Math Cards (ejemplos de copy)

| Girl Math dice... | Rucula dice... |
|---|---|
| "Si pago en cuotas, es plata del futuro, no de hoy" | "Rucula te muestra exactamente cuanto vas a deber en 6 meses. Spoiler: es plata de hoy." |
| "Si esta en oferta, en realidad estoy ahorrando" | "Con presupuestos por categoria sabras si realmente te sobra o si estas en modo autoengano." |
| "Si no miro el resumen, no existe" | "Importa tu resumen en 2 clicks. Rucula lo lee por vos. Sin dolor." |

## Estilo visual

### Tipografia
- Titulos principales: font-black (ya existente) + un acento graffiti via Google Font **Permanent Marker** para palabras clave sueltas (ej: "no cuenta", "gratis", "spoiler")
- El graffiti se usa solo en 1-2 palabras por seccion, nunca en parrafos enteros
- Cuerpo: la tipografia actual del sistema

### Colores
- Fondo principal: blanco/background actual
- Acentos: gradientes rosa-violeta (`from-pink-500 to-purple-500`) para el vibe Gen Z, combinados con el verde primario de Rucula
- Cards: fondo ligeramente rosado o violeta pastel en hover
- Stickers/badges: amarillo, rosa, verde neon como highlights

### Animaciones
- Scroll-triggered con framer-motion (patron existente)
- Las girl math cards hacen un leve "shake" o "bounce" al entrar en viewport
- Ruculin tiene una animacion sutil idle (parpadeo, movimiento de ojos)
- Stickers decorativos rotan ligeramente al scroll

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `src/pages/LandingGenZ.tsx` | Crear - pagina principal que compone todas las secciones |
| `src/components/landing-genz/GenZHero.tsx` | Crear - hero con Ruculin, frase girl math, CTA |
| `src/components/landing-genz/GirlMathCards.tsx` | Crear - carousel/grid de 3 cards "mito vs realidad" |
| `src/components/landing-genz/RuculinExplains.tsx` | Crear - seccion con Ruculin y speech bubbles explicando features |
| `src/components/landing-genz/GenZFeatures.tsx` | Crear - grid rapido de features con iconos |
| `src/components/landing-genz/VibeCheck.tsx` | Crear - social proof estilo tweets/stories |
| `src/components/landing-genz/GenZFooter.tsx` | Crear - CTA final con Ruculin |
| `src/components/landing-genz/Ruculin.tsx` | Crear - componente del personaje con diferentes moods (happy, thinking, wink, surprised) |
| `src/components/landing-genz/GenZNav.tsx` | Crear - navbar minimalista con logo + CTA |
| `src/App.tsx` | Modificar - agregar ruta `/landing-genz` |
| `index.html` | Modificar - agregar Google Font "Permanent Marker" |

## Seccion tecnica

### Google Font
Se agrega `Permanent Marker` via link en `index.html`. Se usa con clase CSS custom `font-graffiti` definida en tailwind config:

```text
fontFamily: {
  graffiti: ['"Permanent Marker"', 'cursive'],
}
```

### Ruculin (componente SVG)
- Circulo verde base con gradiente del design system
- Ojos como circulos blancos con pupilas negras animadas
- Boca que cambia segun el mood (sonrisa, O sorprendido, guino)
- Props: `mood: 'happy' | 'thinking' | 'wink' | 'surprised'`, `size: 'sm' | 'md' | 'lg'`
- Animacion idle con framer-motion: parpadeo cada 3s, pupilas que siguen un patron

### Girl Math Cards
- Componente con dos estados: "girl math" (rosa/violeta) y "realidad Rucula" (verde)
- Transicion flip o slide entre ambos al hacer hover/tap
- En mobile: scroll horizontal tipo carousel con snap

### Ruta
- `/landing-genz` como nueva ruta publica en App.tsx
- Misma estructura que `/landing` y `/landing-apple`

### Responsive
- Mobile-first como toda la app
- Hero: stack vertical, Ruculin mas chico
- Girl math cards: scroll horizontal en mobile, grid 3 cols en desktop
- Features: 2 cols mobile, 3 cols desktop

