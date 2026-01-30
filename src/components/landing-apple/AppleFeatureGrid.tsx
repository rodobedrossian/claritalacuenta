import { motion } from "framer-motion";
import { Mic, FileText } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Registrá gastos",
    subtitle: "en segundos.",
    description: "Hablá naturalmente o escribí rápido. Sin formularios complicados.",
  },
  {
    icon: FileText,
    title: "Importá resúmenes",
    subtitle: "automáticamente.",
    description: "Subí el PDF de tu tarjeta y dejá que la IA haga el resto.",
  },
];

export const AppleFeatureGrid = () => {
  return (
    <section className="py-32 px-6 bg-[#F5F5F7]">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
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
              className="bg-white rounded-3xl p-8 md:p-10"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#1D1D1F] flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-3xl md:text-4xl font-semibold text-[#1D1D1F] tracking-tight leading-tight">
                {feature.title}
                <br />
                <span className="text-[#86868B]">{feature.subtitle}</span>
              </h3>
              
              <p className="mt-4 text-lg text-[#86868B] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
