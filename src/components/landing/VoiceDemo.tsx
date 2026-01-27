import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Mic } from "lucide-react";

const demoText = "Gastè cuarenta mil pesos en el supermercado";

export const VoiceDemo = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    // Start animation cycle
    const startCycle = () => {
      setIsRecording(true);
      setDisplayedText("");
      setShowResult(false);

      // Typewriter effect
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex <= demoText.length) {
          setDisplayedText(demoText.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setIsRecording(false);
            setShowResult(true);
          }, 500);
        }
      }, 60);

      return () => clearInterval(typeInterval);
    };

    const timeout = setTimeout(startCycle, 1000);
    const interval = setInterval(startCycle, 8000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative bg-muted/30 rounded-xl p-4 min-h-[180px]">
      {/* Siri-style orb */}
      <div className="flex justify-center mb-4">
        <motion.div
          animate={isRecording ? {
            scale: [1, 1.15, 1],
            boxShadow: [
              "0 0 0 0 rgba(99, 102, 241, 0.4)",
              "0 0 0 20px rgba(99, 102, 241, 0)",
              "0 0 0 0 rgba(99, 102, 241, 0.4)",
            ]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center"
        >
          <Mic className="w-7 h-7 text-white" />
          
          {/* Waveform visualization */}
          {isRecording && (
            <div className="absolute -bottom-2 flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [4, 12 + Math.random() * 8, 4],
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                  className="w-1 bg-primary rounded-full"
                  style={{ height: 4 }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Transcription area */}
      <div className="text-center min-h-[40px] mb-3">
        <AnimatePresence mode="wait">
          {isRecording && (
            <motion.p
              key="transcript"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-foreground text-sm font-medium"
            >
              {displayedText}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
              />
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Result card */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-lg p-3 border border-border/50 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛒</span>
                <div>
                  <p className="text-xs text-muted-foreground">Supermercado</p>
                  <p className="text-sm font-semibold text-foreground">Gasto registrado</p>
                </div>
              </div>
              <span className="text-sm font-bold text-destructive">-$40.000</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status text */}
      <p className="text-center text-xs text-muted-foreground mt-3">
        {isRecording ? "Escuchando..." : showResult ? "✓ Listo" : "Iniciando..."}
      </p>
    </div>
  );
};
