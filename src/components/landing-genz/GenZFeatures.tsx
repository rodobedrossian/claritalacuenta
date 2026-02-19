import { motion } from "framer-motion";
import { Mic, CreditCard, PieChart, Wallet, TrendingUp, Bell } from "lucide-react";

const features = [
  { icon: Mic, title: "Voz → Gasto", desc: "Dictá y se anota solo" },
  { icon: CreditCard, title: "Tarjetas", desc: "Importá resúmenes en PDF" },
  { icon: PieChart, title: "Presupuestos", desc: "Límites por categoría" },
  { icon: Wallet, title: "Multi-moneda", desc: "ARS + USD, sin vueltas" },
  { icon: TrendingUp, title: "Proyecciones", desc: "Mirá el futuro de tus cuotas" },
  { icon: Bell, title: "Alertas", desc: "Te avisamos si te pasás" },
];

export function GenZFeatures() {
  return (
    <section className="py-20 sm:py-28 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
            FEATURES
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground">
            Todo lo que hace{" "}
            <span className="font-graffiti text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
              Rúcula
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group rounded-2xl border border-border/50 bg-card p-5 sm:p-6 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-sm sm:text-base">{f.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
