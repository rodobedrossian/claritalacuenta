import { motion } from "framer-motion";
import { MonthlyAnalyticsMockup } from "./MonthlyAnalyticsMockup";
import { InstallmentProjectionMockup } from "./InstallmentProjectionMockup";
import { InsightsMockup } from "./InsightsMockup";
import { BarChart3, TrendingDown, Brain, Sparkles } from "lucide-react";
const features = [{
  icon: BarChart3,
  title: "Analytics mensuales",
  description: "Visualizá tus gastos por categoría con charts interactivos y totales en pesos y dólares."
}, {
  icon: TrendingDown,
  title: "Proyección de cuotas",
  description: "Sabé exactamente cuánto vas a pagar en cuotas los próximos meses y cuándo se liberan."
}, {
  icon: Brain,
  title: "Insights con IA",
  description: "Detectamos patrones, anomalías y te damos consejos accionables para mejorar tus finanzas."
}];
export const AnalyticsSection = () => {
  return <section className="py-24 bg-gradient-to-b from-background via-muted/20 to-background overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.6
      }} className="text-center mb-16">
          
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground mb-6">
            Datos que te ayudan a{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              tomar mejores decisiones
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No solo registrás gastos. Clarita analiza tus patrones, proyecta tus compromisos 
            y te da insights accionables para que tengas el control total.
          </p>
        </motion.div>

        {/* Features Pills */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        delay: 0.2
      }} className="flex flex-wrap justify-center gap-4 mb-16">
          {features.map((feature, i) => <motion.div key={feature.title} initial={{
          opacity: 0,
          scale: 0.9
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} transition={{
          delay: 0.3 + i * 0.1
        }} className="flex items-center gap-3 px-5 py-3 bg-card rounded-xl border border-border/50 shadow-stripe">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{feature.title}</h4>
                <p className="text-xs text-muted-foreground max-w-[200px]">{feature.description}</p>
              </div>
            </motion.div>)}
        </motion.div>

        {/* Mockups Stack - Full Width */}
        <div className="space-y-8 max-w-5xl mx-auto">
          <MonthlyAnalyticsMockup />
          <InstallmentProjectionMockup />
          <InsightsMockup />
        </div>
      </div>
    </section>;
};