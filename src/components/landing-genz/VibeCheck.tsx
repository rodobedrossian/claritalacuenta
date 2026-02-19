import { motion } from "framer-motion";
import { Heart, MessageCircle, Repeat2 } from "lucide-react";

const tweets = [
  {
    user: "sofi_invierte",
    handle: "@sofi_ok",
    text: "Importé mi resumen de Visa y casi me desmayo. Pero al menos ahora SÉ. Gracias Rúcula 🥬",
    likes: 847,
  },
  {
    user: "nico.finanzas",
    handle: "@nicodev",
    text: "Le puse límite de presupuesto a delivery y Rúcula me avisó a los 3 días que ya me lo gasté todo jajaja",
    likes: 1203,
  },
  {
    user: "caro.ahorra",
    handle: "@caroflow",
    text: "Dicté 'gasté 5 lucas en Uber' y se anotó solo. Literal girl math era no anotarlo 💀",
    likes: 632,
  },
  {
    user: "mati.cuotas",
    handle: "@matias_s",
    text: "La proyección de cuotas me mostró que voy a deber 80k en marzo. Modo crisis activado pero al menos estoy preparado",
    likes: 419,
  },
];

export function VibeCheck() {
  return (
    <section className="py-20 sm:py-28 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
            VIBE CHECK ✨
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">
            La gente{" "}
            <span className="font-graffiti text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
              opina
            </span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {tweets.map((t, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border/50 bg-card p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {t.user[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{t.user}</p>
                  <p className="text-xs text-muted-foreground">{t.handle}</p>
                </div>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{t.text}</p>
              <div className="flex items-center gap-5 mt-4 text-muted-foreground">
                <span className="flex items-center gap-1 text-xs">
                  <Heart className="w-3.5 h-3.5" /> {t.likes}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <MessageCircle className="w-3.5 h-3.5" /> {Math.floor(t.likes * 0.12)}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <Repeat2 className="w-3.5 h-3.5" /> {Math.floor(t.likes * 0.08)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
