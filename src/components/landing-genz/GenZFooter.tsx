import { motion } from "framer-motion";
import { Ruculin } from "./Ruculin";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function GenZFooter() {
  const navigate = useNavigate();

  return (
    <section className="py-24 sm:py-32 px-4 text-center relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring" }}
        >
          <Ruculin mood="wink" size="lg" />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground"
        >
          Dale,{" "}
          <span className="font-graffiti text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            animate
          </span>
          .
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-lg"
        >
          Tu plata no se va a organizar sola. Pero con Rúcula, casi.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="rounded-full px-10 text-base bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0 shadow-lg shadow-pink-500/25"
          >
            Crear cuenta gratis
          </Button>
        </motion.div>

        <p className="text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} Rúcula · 
          <a href="/privacy" className="underline ml-1 hover:text-foreground transition-colors">Privacidad</a>
        </p>
      </div>
    </section>
  );
}
