import { motion } from "framer-motion";

const categories = [
  { name: "Supermercado", value: 85, amount: "$125.000", color: "hsl(var(--primary))" },
  { name: "Transporte", value: 45, amount: "$67.500", color: "hsl(var(--success))" },
  { name: "Entretenimiento", value: 65, amount: "$97.500", color: "hsl(var(--warning))" },
  { name: "Servicios", value: 35, amount: "$52.500", color: "hsl(var(--destructive))" },
  { name: "Otros", value: 25, amount: "$37.500", color: "hsl(var(--muted-foreground))" },
];

export const AppleAnalyticsSection = () => {
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
            Entendé tus gastos.
            <br />
            <span className="text-muted-foreground">De un vistazo.</span>
          </h2>
        </motion.div>
        
        {/* Clean Chart Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="bg-card rounded-3xl p-8 md:p-12 shadow-stripe border border-border"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-foreground">Enero 2026</h3>
            <span className="text-sm text-muted-foreground">Total: $380.000</span>
          </div>
          
          <div className="space-y-5">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: 0.3 + index * 0.08, 
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{category.name}</span>
                  <span className="text-muted-foreground tabular-nums">{category.amount}</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${category.value}%` }}
                    viewport={{ once: true }}
                    transition={{ 
                      delay: 0.5 + index * 0.08, 
                      duration: 0.8,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
