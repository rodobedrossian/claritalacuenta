import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";

const insights = [
  {
    icon: TrendingUp,
    type: "alert",
    title: "Gastaste 45% más en Delivery este mes",
    description: "El aumento fue por más pedidos, no por tickets más altos.",
    color: "destructive",
  },
  {
    icon: AlertTriangle,
    type: "warning", 
    title: "Presupuesto de Entretenimiento al 85%",
    description: "Te quedan $12.500 para el resto del mes.",
    color: "warning",
  },
  {
    icon: Lightbulb,
    type: "tip",
    title: "En Marzo liberás $78.500 en cuotas",
    description: "Considerá destinar ese monto a tus ahorros.",
    color: "success",
  },
];

export const AppleInsightsSection = () => {
  return (
    <section className="py-24 md:py-32 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-foreground tracking-tight leading-tight">
            Insights que
            <br />
            <span className="text-muted-foreground">te ahorran plata.</span>
          </h2>
        </motion.div>
        
        {/* Insights Cards */}
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                delay: 0.2 + index * 0.1, 
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1]
              }}
              className="bg-card rounded-2xl p-6 shadow-stripe border border-border hover:shadow-stripe-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-${insight.color}/10 shrink-0`}>
                  <insight.icon className={`w-5 h-5 text-${insight.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground leading-snug">
                    {insight.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* AI Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-10 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shadow-stripe">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Análisis inteligente con IA</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
