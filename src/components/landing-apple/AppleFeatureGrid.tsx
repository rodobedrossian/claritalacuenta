import { motion } from "framer-motion";
import { Mic, FileText, TrendingUp, PiggyBank, CreditCard, Receipt, Sparkles } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Registrá gastos",
    subtitle: "con tu voz.",
    description: "Hablá naturalmente. La IA entiende lo que gastaste y lo categoriza por vos.",
    gradient: "from-primary to-primary-glow",
  },
  {
    icon: FileText,
    title: "Importá resúmenes",
    subtitle: "automáticamente.",
    description: "Subí el PDF de tu tarjeta y dejá que la IA extraiga todas las transacciones.",
    gradient: "from-success to-success/70",
  },
];

const miniFeatures = [
  { icon: TrendingUp, label: "Analytics en tiempo real" },
  { icon: PiggyBank, label: "Control de ahorros" },
  { icon: CreditCard, label: "Gestión de tarjetas" },
  { icon: Receipt, label: "Gastos recurrentes" },
  { icon: Sparkles, label: "Insights inteligentes" },
];

export const AppleFeatureGrid = () => {
  return (
    <section className="py-24 md:py-32 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        {/* Main Features */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: [0.25, 0.1, 0.25, 1]
              }}
              className="bg-card rounded-3xl p-8 md:p-10 border border-border shadow-stripe hover:shadow-stripe-md transition-shadow"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight leading-tight">
                {feature.title}
                <br />
                <span className="text-muted-foreground">{feature.subtitle}</span>
              </h3>
              
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
        
        {/* Mini Features Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-12 flex flex-wrap justify-center gap-3"
        >
          {miniFeatures.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + index * 0.05, duration: 0.4 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-card rounded-full border border-border shadow-stripe"
            >
              <item.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
