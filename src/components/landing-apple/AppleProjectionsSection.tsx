import { motion } from "framer-motion";
import { Calendar, TrendingDown, CreditCard } from "lucide-react";

const projections = [
  { month: "Feb 2026", amount: "$45.000", installments: 2, description: "Últimas cuotas de Mercado Libre" },
  { month: "Mar 2026", amount: "$78.500", installments: 3, description: "Terminan cuotas de Garbarino" },
  { month: "Abr 2026", amount: "$32.000", installments: 1, description: "Última cuota ONDA" },
];

export const AppleProjectionsSection = () => {
  return (
    <section className="py-24 md:py-32 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-foreground tracking-tight leading-tight">
            Sabé cuándo terminás
            <br />
            <span className="text-muted-foreground">de pagar.</span>
          </h2>
        </motion.div>
        
        {/* Projections Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="bg-card rounded-3xl p-8 md:p-10 shadow-stripe border border-border"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-primary/10">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Proyección de Cuotas</h3>
              <p className="text-sm text-muted-foreground">Cuándo se libera tu plata</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {projections.map((item, index) => (
              <motion.div
                key={item.month}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: 0.3 + index * 0.1, 
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-border"
              >
                <div className="p-2.5 rounded-xl bg-success/10">
                  <Calendar className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{item.month}</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full">
                      +{item.amount} liberados
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-xs font-medium">{item.installments} cuotas</span>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-6 text-center text-sm text-muted-foreground"
          >
            Visualizá mes a mes cuánto liberás en cuotas
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};
