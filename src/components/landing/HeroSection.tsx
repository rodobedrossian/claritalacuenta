import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingOrbs } from "./FloatingOrbs";
import { DashboardMockup } from "./DashboardMockup";
import logoImage from "@/assets/logo-clarita.png";
export const HeroSection = () => {
  return <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <FloatingOrbs />
      
      <div className="container mx-auto px-4 py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left side - Text content */}
          <motion.div className="text-center lg:text-left z-10" initial={{
          opacity: 0,
          x: -30
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.6
        }}>
            {/* Logo */}
            <motion.div className="flex items-center justify-center lg:justify-start gap-3 mb-6" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            delay: 0.2
          }}>
              
              <span className="text-2xl font-black tracking-tight text-foreground">
                Clarita la cuenta
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground mb-6 leading-tight" initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.4
          }}>
              Tus finanzas,{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                claras y simples
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8" initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.5
          }}>
              Registrá ingresos, gastos y ahorros en pesos y dólares. 
              Todo en un solo lugar, sin complicaciones.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start" initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.6
          }}>
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 shadow-stripe-md group">
                <Link to="/auth">
                  Empezar gratis
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-border hover:bg-muted/50" onClick={() => document.getElementById('features')?.scrollIntoView({
              behavior: 'smooth'
            })}>
                Ver cómo funciona
              </Button>
            </motion.div>

            {/* Trust indicators */}
            
          </motion.div>

          {/* Right side - Dashboard mockup */}
          <div className="relative z-10 lg:pl-8">
            <DashboardMockup />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      
    </section>;
};