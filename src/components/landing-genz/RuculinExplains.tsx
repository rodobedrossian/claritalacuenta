import { motion } from "framer-motion";
import { Ruculin } from "./Ruculin";

interface Bubble {
  text: string;
  highlight: string;
  mood: "happy" | "thinking" | "wink" | "surprised";
  side: "left" | "right";
}

const bubbles: Bubble[] = [
  {
    text: "Anotá un gasto con la voz. Decís 'gasté 2 lucas en el super' y",
    highlight: "listo, anotado.",
    mood: "happy",
    side: "left",
  },
  {
    text: "¿Cuotas sin fin? Te muestro mes a mes cuánto pagás de tarjeta.",
    highlight: "Sin sorpresas.",
    mood: "thinking",
    side: "right",
  },
  {
    text: "Ponete un presupuesto por categoría. Si te pasás,",
    highlight: "yo te aviso.",
    mood: "wink",
    side: "left",
  },
  {
    text: "¿Ahorrás en pesos y dólares? Controlá todo junto.",
    highlight: "Multi-moneda real.",
    mood: "surprised",
    side: "right",
  },
];

export function RuculinExplains() {
  return (
    <section className="py-20 sm:py-28 px-4 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-4">
            RUCULIN TE EXPLICA
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">
            Finanzas en{" "}
            <span className="font-graffiti text-primary">modo fácil</span>
          </h2>
        </motion.div>

        <div className="flex flex-col gap-8">
          {bubbles.map((b, i) => (
            <motion.div
              key={i}
              initial={{ x: b.side === "left" ? -30 : 30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`flex items-start gap-4 ${
                b.side === "right" ? "flex-row-reverse text-right" : ""
              }`}
            >
              <div className="shrink-0">
                <Ruculin mood={b.mood} size="sm" />
              </div>
              <div
                className={`relative max-w-md rounded-2xl px-5 py-4 shadow-sm ${
                  b.side === "left"
                    ? "bg-card border border-border/50 rounded-tl-sm"
                    : "bg-card border border-border/50 rounded-tr-sm"
                }`}
              >
                <p className="text-sm sm:text-base text-foreground leading-relaxed">
                  {b.text}{" "}
                  <span className="font-graffiti text-primary">{b.highlight}</span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
