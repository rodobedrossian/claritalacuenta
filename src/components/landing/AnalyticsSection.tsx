import { motion } from "framer-motion";
import { AnalyticsMockup } from "./AnalyticsMockup";
import { TrendingUp, Brain, LineChart } from "lucide-react";

export const AnalyticsSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              Analytics e Insights
            </motion.span>
            
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-6">
              Datos que te ayudan a{" "}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                tomar mejores decisiones
              </span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              No solo registrás gastos. Clarita analiza tus patrones, te avisa 
              cuando te estás excediendo y te da insights accionables.
            </p>

            {/* Features list */}
            <div className="space-y-4">
              {[
                {
                  icon: Brain,
                  title: "Insights con IA",
                  description: "Detectamos patrones y te sugerimos cómo mejorar"
                },
                {
                  icon: LineChart,
                  title: "Proyecciones",
                  description: "Sabé cuánto vas a pagar en cuotas los próximos meses"
                },
                {
                  icon: TrendingUp,
                  title: "Tendencias",
                  description: "Compará mes a mes y entendé tu evolución financiera"
                }
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-foreground mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right side - Analytics mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AnalyticsMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
