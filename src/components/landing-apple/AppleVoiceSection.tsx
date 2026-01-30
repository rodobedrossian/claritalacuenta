import { motion } from "framer-motion";

export const AppleVoiceSection = () => {
  // Static waveform bars
  const bars = [0.3, 0.5, 0.8, 0.6, 1, 0.7, 0.9, 0.4, 0.6, 0.8, 0.5, 0.7, 0.3, 0.5, 0.4];

  return (
    <section className="py-32 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-[#1D1D1F] tracking-tight">
            Hablá. Registrá.
          </h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-8 text-2xl md:text-3xl text-[#86868B] font-light italic"
          >
            "Gasté cuarenta mil en el super"
          </motion.p>
        </motion.div>
        
        {/* Minimalist Waveform */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 flex items-center justify-center gap-1"
        >
          {bars.map((height, index) => (
            <motion.div
              key={index}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ 
                delay: 0.4 + index * 0.03, 
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1]
              }}
              className="w-1.5 md:w-2 bg-[#86868B]/30 rounded-full origin-bottom"
              style={{ height: `${height * 60}px` }}
            />
          ))}
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 text-sm text-[#86868B]"
        >
          Transcripción instantánea con IA
        </motion.p>
      </div>
    </section>
  );
};
