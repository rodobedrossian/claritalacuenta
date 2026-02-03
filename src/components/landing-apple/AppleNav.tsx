import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const AppleNav = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 md:px-12 transition-all duration-300 ${
        scrolled 
          ? "bg-background/80 backdrop-blur-xl border-b border-border" 
          : "bg-transparent"
      }`}
    >
      <Link 
        to="/landing-apple" 
        className="flex items-center gap-2"
      >
        <div className="p-1.5 rounded-xl gradient-primary">
          <img src="/rucula-logo.png" alt="Rucula" className="h-5 w-5 object-contain" />
        </div>
        <span className="text-foreground text-xl font-semibold tracking-tight">
          Rucula
        </span>
      </Link>
      
      <Link
        to="/auth"
        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        Empezar
      </Link>
    </motion.nav>
  );
};
