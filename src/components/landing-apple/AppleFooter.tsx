import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const AppleFooter = () => {
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
            Empezá gratis.
          </h2>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-10"
          >
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0071E3] text-white text-lg font-medium rounded-full hover:bg-[#0071E3]/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Comenzar
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 text-[#86868B]"
          >
            Disponible para iPhone y web.
          </motion.p>
        </motion.div>
      </div>
      
      {/* Footer Links */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="max-w-4xl mx-auto mt-24 pt-8 border-t border-[#1D1D1F]/10"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#86868B]">
          <span>Clarita la cuenta</span>
          
          <div className="flex items-center gap-6">
            <Link 
              to="/privacy" 
              className="hover:text-[#1D1D1F] transition-colors"
            >
              Privacidad
            </Link>
          </div>
          
          <span>© 2026</span>
        </div>
      </motion.div>
    </section>
  );
};
