import { motion } from "framer-motion";
import { ApplePhoneMockup } from "./ApplePhoneMockup";

export const AppleHero = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-14 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold text-foreground tracking-tight leading-[1.05]">
          Tus finanzas.
        </h1>
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold text-foreground tracking-tight leading-[1.05]">
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Claras.
          </span>
        </h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-md mx-auto"
        >
          Registrá gastos, controlá tus tarjetas y entendé tu plata.
        </motion.p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-sm"
      >
        <ApplePhoneMockup />
      </motion.div>
    </section>
  );
};
