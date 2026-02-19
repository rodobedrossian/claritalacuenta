import { motion } from "framer-motion";
import { useState } from "react";
import { Ruculin } from "./Ruculin";
import type { ReactNode } from "react";

interface GirlMathItem {
  myth: string;
  mythEmoji: string;
  reality: string;
  mood: "happy" | "thinking" | "wink" | "surprised";
}

const items: GirlMathItem[] = [
  {
    myth: '"Si pago en cuotas, es plata del futuro, no de hoy"',
    mythEmoji: "💅",
    reality: "Rúcula te muestra exactamente cuánto vas a deber en 6 meses. Spoiler: es plata de hoy.",
    mood: "wink",
  },
  {
    myth: '"Si está en oferta, en realidad estoy ahorrando"',
    mythEmoji: "🛍️",
    reality: "Con presupuestos por categoría sabés si realmente te sobra o si estás en modo autoengaño.",
    mood: "thinking",
  },
  {
    myth: '"Si no miro el resumen, no existe"',
    mythEmoji: "🙈",
    reality: "Importá tu resumen en 2 clicks. Rúcula lo lee por vos. Sin dolor.",
    mood: "surprised",
  },
];

function FlipCard({ item, index }: { item: GirlMathItem; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="perspective-1000 min-w-[280px] sm:min-w-0"
    >
      <div
        onClick={() => setFlipped(!flipped)}
        onMouseEnter={() => setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
        className="relative cursor-pointer"
        style={{ minHeight: 280 }}
      >
        {/* Myth side */}
        <div
          className={`absolute inset-0 rounded-2xl p-6 flex flex-col justify-between transition-all duration-500 ${
            flipped ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
          } bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/40 dark:to-purple-950/40 border border-pink-200/50 dark:border-pink-800/30`}
        >
          <span className="text-4xl">{item.mythEmoji}</span>
          <p className="text-lg font-bold text-foreground leading-snug mt-4">{item.myth}</p>
          <span className="text-xs text-muted-foreground mt-4 font-medium">
            Tocá para la <span className="font-graffiti text-primary">realidad</span> →
          </span>
        </div>

        {/* Reality side */}
        <div
          className={`absolute inset-0 rounded-2xl p-6 flex flex-col justify-between transition-all duration-500 ${
            flipped ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          } bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/40 dark:to-green-950/40 border border-primary/30`}
        >
          <Ruculin mood={item.mood} size="sm" />
          <p className="text-base text-foreground leading-relaxed mt-3 font-medium">{item.reality}</p>
          <span className="text-xs font-graffiti text-primary mt-3">— Ruculin 🌿</span>
        </div>
      </div>
    </motion.div>
  );
}

export function GirlMathCards() {
  return (
    <section id="girl-math" className="py-20 sm:py-28 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
            GIRL MATH vs REALIDAD
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">
            ¿Te sentís{" "}
            <span className="font-graffiti text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
              identificada
            </span>
            ?
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Pasá el dedo o hacé hover para ver qué dice Ruculin
          </p>
        </motion.div>

        {/* Mobile: horizontal scroll, Desktop: grid */}
        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 no-scrollbar">
          {items.map((item, i) => (
            <div key={i} className="snap-center shrink-0 w-[280px] sm:w-auto">
              <FlipCard item={item} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
