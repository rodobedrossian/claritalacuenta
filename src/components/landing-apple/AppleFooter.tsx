import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { RuculaLogo } from "@/components/RuculaLogo";
import appStoreBadge from "@/assets/app-store-badge.svg";

export const AppleFooter = () => {
  return (
    <footer className="py-24 md:py-32 px-6 bg-background">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-8"
        >
          {/* Logo */}
          <div className="flex justify-center">
            <RuculaLogo size="lg" />
          </div>
          
          {/* CTA */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight">
            Empezá hoy.
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Tomá el control de tu plata. Sin complicaciones.
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full gradient-primary text-primary-foreground font-semibold text-lg shadow-stripe-lg hover:shadow-stripe-lg hover:scale-[1.02] transition-all"
            >
              Crear cuenta web
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            {/* App Store Badge */}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
              aria-label="Descargar en App Store"
            >
              <img 
                src={appStoreBadge} 
                alt="Descargar en el App Store" 
                className="h-[52px]"
              />
            </a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Próximamente en App Store
          </p>
        </motion.div>
        
        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-20 pt-8 border-t border-border"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 Rucula. Todos los derechos reservados.</p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacidad
              </Link>
              <Link to="/legales" className="hover:text-foreground transition-colors">
                Términos
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
