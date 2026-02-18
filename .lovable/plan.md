# Rediseno del Dashboard: Estilo Fintech Nativo iOS

## Vision

Transformar el dashboard de una "web responsive" a una experiencia que se sienta como una app nativa de fintech premium. Inspiracion directa en Revolut (hero card oscuro con gradiente), Wise (jerarquia clara, espacios generosos), y la estetica de Apple Wallet.

## Cambios principales

### 1. Hero Balance Card con gradiente oscuro

Reemplazar el header actual (fondo blanco plano con texto verde) por un **hero card** prominente con gradiente oscuro que ocupe el tope de la pantalla. Este es el cambio de mayor impacto visual.

```text
+------------------------------------------+
|  [gradiente oscuro verde/esmeralda]      |
|  [Enero 2026]  < >        (month picker) |
|                                          |
|  Balance Neto                            |
|  $847.520                  (grande, bold)|
|                                          |
|                                          |
|  +----------+ +----------+ +----------+ |
|  | Ingresos | | Gastos   | | Ahorros  | |
|  | $1.2M    | | $402K    | | USD 320  | |
|  +----------+ +----------+ +----------+ |
+------------------------------------------+
```

- Gradiente: de `hsl(152 55% 28%)` a `hsl(165 50% 22%)` (verde esmeralda oscuro)
- Texto del balance en blanco, grande (text-4xl), font-black
- Los 3 mini-stats (ingresos/gastos/ahorros) como pills semi-transparentes dentro del hero
- Bordes redondeados inferiores (rounded-b-3xl) para un look de "card flotante"
- El selector de mes integrado dentro del hero, no separado

### 2. MobileHeader simplificado

El header "Hola, nombre" se mantiene pero se integra visualmente con el hero:

- Fondo transparente sobre el hero card
- Tipo de cambio como chip discreto en la esquina superior derecha
- Sin borde inferior (el hero fluye desde el header)

### 3. Quick Actions rediseñados

Los 3 botones de accion rapida (Agregar, Por voz, Ahorrar) pasan de ser botones outline cuadrados a **circulos con iconos** estilo iOS, sin texto visible en reposo:

```text
   (o)  Agregar     (o)  Por voz     (o)  Ahorrar
```

- Circulos de 56px con fondo semi-transparente
- Labels debajo en texto pequeno (text-[10px])
- Animacion de escala al tocar (whileTap)

### 4. Secciones con scroll horizontal nativo

Las StatCards individuales de ingresos/gastos/ahorros se mueven **dentro** del hero card como mini-stats, eliminando las cards separadas que ocupan mucho espacio vertical. Esto libera espacio para el contenido real (presupuestos, insights, chart).

### 5. Cards con bordes mas suaves

- Eliminar `shadow-stripe` de las cards internas
- Usar bordes ultra-sutiles (`border-border/30`)
- Agregar `backdrop-blur` sutil en cards sobre scroll
- Border radius mas grande (rounded-2xl)

### 6. Transacciones recientes con estilo nativo

La lista de transacciones se muestra sin card wrapper, directamente como filas tipo lista nativa iOS con separadores finos, y un header "sticky" con "Ver todas".

## Archivos a modificar


| Archivo                                     | Cambio                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/index.css`                             | Agregar variables CSS para hero gradient, nuevas sombras, y utilidades                                 |
| `src/components/DashboardHeader.tsx`        | Rediseno completo: hero card con gradiente oscuro, mini-stats integrados, month picker dentro del hero |
| `src/components/MobileHeader.tsx`           | Hacerlo transparente/overlay sobre el hero, mover exchange rate a chip                                 |
| `src/components/QuickActions.tsx`           | Rediseno a circulos con iconos estilo iOS                                                              |
| `src/pages/Index.tsx`                       | Reestructurar layout mobile: eliminar StatCards separados (se mueven al hero), ajustar spacing         |
| `src/components/StatCard.tsx`               | Ajustes menores de styling (border radius, shadows mas suaves)                                         |
| `src/components/budgets/BudgetProgress.tsx` | Simplificar bordes y shadows para consistencia                                                         |
| `src/components/SpendingChart.tsx`          | Simplificar card wrapper                                                                               |
| `src/components/insights/InsightsCard.tsx`  | Ajuste de spacing                                                                                      |


## Seccion tecnica

### Nuevas variables CSS

- `--gradient-hero`: gradiente oscuro verde esmeralda para el hero
- `--hero-foreground`: color de texto sobre el hero (blanco)
- `--hero-muted`: color de texto secundario sobre el hero (blanco/60%)

### DashboardHeader (cambio principal)

El componente recibira las props de ingresos/gastos/ahorros ademas del balance neto, para renderizar los mini-stats dentro del hero. Se elimina la dependencia de StatCard en el layout mobile del dashboard.

### Estructura mobile resultante

```text
MobileHeader (transparente, sobre hero)
  |
HeroCard (gradiente oscuro)
  |- Month picker
  |- Balance neto (grande, blanco)
  |- Mini stats row (ingresos | gastos | ahorros)
  |
QuickActions (circulos)
  |
BudgetProgress (card suave)
  |
InsightsCard
  |
SpendingChart
  |
TransactionsList (sin wrapper card)
```

### Desktop

El hero se aplica igualmente en desktop, ocupando el ancho completo del area de contenido, con los mini-stats en una fila de 3 columnas dentro del gradiente.

## Lo que NO cambia

- Bottom navigation (ya esta bien)
- Logica de datos, hooks, dialogs
- Flujo de voz, importacion de resumenes
- Paginas secundarias (Tarjetas, Ahorros, etc)