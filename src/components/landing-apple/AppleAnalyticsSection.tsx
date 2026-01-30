import { motion } from "framer-motion";

const categories = [
  { name: "Supermercado", value: 85, amount: "$125.000" },
  { name: "Transporte", value: 45, amount: "$67.500" },
  { name: "Entretenimiento", value: 65, amount: "$97.500" },
  { name: "Servicios", value: 35, amount: "$52.500" },
  { name: "Otros", value: 25, amount: "$37.500" },
];

export const AppleAnalyticsSection = () => {
  return (
    <section className="py-32 px-6 bg-[#F5F5F7]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-[#1D1D1F] tracking-tight leading-tight">
            Entendé tus gastos.
            <br />
            <span className="text-[#86868B]">De un vistazo.</span>
          </h2>
        </motion.div>
        
        {/* Clean Chart */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-[#1D1D1F]">Enero 2026</h3>
            <span className="text-sm text-[#86868B]">Total: $380.000</span>
          </div>
          
          <div className="space-y-6">
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
                  <span className="text-[#1D1D1F] font-medium">{category.name}</span>
                  <span className="text-[#86868B]">{category.amount}</span>
                </div>
                <div className="h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${category.value}%` }}
                    viewport={{ once: true }}
                    transition={{ 
                      delay: 0.5 + index * 0.08, 
                      duration: 0.8,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    className="h-full bg-[#0071E3] rounded-full"
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
