import { motion } from "framer-motion";
import { Ruculin } from "./Ruculin";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function GenZHero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Decorative blobs */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
      <div className="absolute top-40 right-1/4 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-6">
        {/* Sticker badge */}
        <motion.div
          initial={{ rotate: -8, scale: 0 }}
          animate={{ rotate: -6, scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-flex items-center gap-1.5 bg-yellow-300 text-yellow-900 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          100% gratis · 0% juicio
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Ruculin mood="happy" size="lg" className="mx-auto mb-2" />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight text-foreground"
        >
          Girl math dice que si no lo anotaste,{" "}
          <span className="font-graffiti text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            no lo gastaste
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl"
        >
          Ruculin te ayuda a entender tu plata sin aburrirte.
          Anotá gastos, controlá tarjetas y ahorrá en serio.{" "}
          <span className="font-semibold text-foreground">Sin Excel. Sin drama.</span>
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-3 mt-2"
        >
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="rounded-full px-8 text-base bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0 shadow-lg shadow-pink-500/25"
          >
            Empezar gratis
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              document.getElementById("girl-math")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-full px-8 text-base"
          >
            ¿Qué es girl math? 👀
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
