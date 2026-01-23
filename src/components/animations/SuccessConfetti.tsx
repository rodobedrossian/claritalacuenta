import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

interface SuccessConfettiProps {
  show: boolean;
  onComplete?: () => void;
  message?: string;
}

// Generate random particles
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100 - 50, // -50 to 50
    y: -(Math.random() * 150 + 50), // -50 to -200 (upward)
    rotation: Math.random() * 720 - 360,
    scale: Math.random() * 0.5 + 0.5,
    color: [
      "hsl(var(--primary))",
      "hsl(142 76% 36%)", // green
      "hsl(48 96% 53%)", // yellow/gold
      "hsl(221 83% 53%)", // blue
      "hsl(280 87% 65%)", // purple
    ][Math.floor(Math.random() * 5)],
    shape: ["circle", "square", "star"][Math.floor(Math.random() * 3)] as "circle" | "square" | "star",
    delay: Math.random() * 0.2,
  }));
};

const Particle = ({ 
  x, y, rotation, scale, color, shape, delay 
}: { 
  x: number; 
  y: number; 
  rotation: number; 
  scale: number; 
  color: string;
  shape: "circle" | "square" | "star";
  delay: number;
}) => {
  const size = 8 * scale;
  
  return (
    <motion.div
      className="absolute"
      style={{ 
        width: size, 
        height: size,
        left: "50%",
        top: "50%",
      }}
      initial={{ 
        x: 0, 
        y: 0, 
        opacity: 1, 
        rotate: 0,
        scale: 0 
      }}
      animate={{ 
        x: x * 3, 
        y: y, 
        opacity: [1, 1, 0],
        rotate: rotation,
        scale: [0, 1, 0.5]
      }}
      transition={{ 
        duration: 1.2,
        delay,
        ease: "easeOut"
      }}
    >
      {shape === "circle" && (
        <div 
          className="w-full h-full rounded-full" 
          style={{ backgroundColor: color }}
        />
      )}
      {shape === "square" && (
        <div 
          className="w-full h-full rounded-sm" 
          style={{ backgroundColor: color }}
        />
      )}
      {shape === "star" && (
        <Sparkles 
          className="w-full h-full" 
          style={{ color }}
        />
      )}
    </motion.div>
  );
};

export const SuccessConfetti = ({ 
  show, 
  onComplete,
  message = "¡Transacción guardada!" 
}: SuccessConfettiProps) => {
  const [particles, setParticles] = useState<ReturnType<typeof generateParticles>>([]);

  useEffect(() => {
    if (show) {
      setParticles(generateParticles(24));
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
      }
      
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Center content */}
          <div className="relative">
            {/* Particles */}
            <div className="absolute inset-0 overflow-visible">
              {particles.map((particle) => (
                <Particle key={particle.id} {...particle} />
              ))}
            </div>

            {/* Success circle */}
            <motion.div
              className="relative z-10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 15,
                delay: 0.1 
              }}
            >
              {/* Outer glow rings */}
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.5, 1.8], opacity: [0.5, 0.2, 0] }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ width: 120, height: 120, marginLeft: -60, marginTop: -60 }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/30"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.3, 1.5], opacity: [0.6, 0.3, 0] }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                style={{ width: 120, height: 120, marginLeft: -60, marginTop: -60 }}
              />

              {/* Main circle */}
              <motion.div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 12,
                  delay: 0.15
                }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <Check className="h-12 w-12 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Message */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 top-full mt-6 text-center whitespace-nowrap"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <p className="text-xl font-semibold text-foreground">
                {message}
              </p>
              <motion.p
                className="text-sm text-muted-foreground mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                Creada por voz
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
