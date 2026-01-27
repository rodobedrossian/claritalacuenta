import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo-clarita.png";
const features = [{
  icon: Shield,
  text: "Datos encriptados"
}, {
  icon: Zap,
  text: "Registro instantáneo"
}];
export const FooterCTA = () => {
  return <section className="relative py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-background to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
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
      }} className="max-w-3xl mx-auto text-center">
          {/* Logo */}
          

          {/* Headline */}
          <motion.h2 initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: 0.3
        }} className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground mb-6">
            ¿Listo para tener{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              claridad financiera
            </span>
            ?
          </motion.h2>

          {/* Subtitle */}
          <motion.p initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: 0.4
        }} className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Unite a miles de personas que ya están manejando mejor sus finanzas con Clarita.
          </motion.p>

          {/* CTA Button */}
          <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} transition={{
          delay: 0.5,
          type: "spring"
        }}>
            <Button asChild size="lg" className="text-lg px-10 py-7 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 shadow-stripe-lg group">
              <Link to="/auth">
                Crear cuenta gratis
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>

          {/* Features */}
          
        </motion.div>

        {/* Footer links */}
        <motion.div initial={{
        opacity: 0
      }} whileInView={{
        opacity: 1
      }} viewport={{
        once: true
      }} transition={{
        delay: 0.8
      }} className="mt-20 pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Clarita la cuenta" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-bold text-foreground">Clarita la cuenta</span>
            </div>
            
            

            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Clarita la cuenta
            </p>
          </div>
        </motion.div>
      </div>
    </section>;
};