import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ShoppingCart, Car, Coffee, Film, Zap, Home } from "lucide-react";

const categories = [
  { icon: ShoppingCart, label: "Supermercado", color: "bg-blue-500" },
  { icon: Car, label: "Transporte", color: "bg-purple-500" },
  { icon: Coffee, label: "Café", color: "bg-amber-500" },
  { icon: Film, label: "Entretenimiento", color: "bg-pink-500" },
  { icon: Zap, label: "Servicios", color: "bg-cyan-500" },
  { icon: Home, label: "Hogar", color: "bg-green-500" },
];

const keypadNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "←"];

export const WizardMockup = () => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(-1);

  useEffect(() => {
    // Animate through steps
    const sequence = async () => {
      // Step 1: Type amount
      setStep(1);
      setAmount("");
      setSelectedCategory(-1);
      
      const amountChars = "15500";
      for (let i = 0; i < amountChars.length; i++) {
        await new Promise(r => setTimeout(r, 200));
        setAmount(prev => prev + amountChars[i]);
      }
      
      await new Promise(r => setTimeout(r, 600));
      
      // Step 2: Select category
      setStep(2);
      await new Promise(r => setTimeout(r, 800));
      setSelectedCategory(0);
      
      await new Promise(r => setTimeout(r, 600));
      
      // Step 3: Confirmation
      setStep(3);
      await new Promise(r => setTimeout(r, 2500));
    };

    sequence();
    const interval = setInterval(sequence, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-muted/30 rounded-xl p-3 h-[300px] flex flex-col">
      {/* Step indicator */}
      <div className="flex justify-center gap-2 mb-4 shrink-0">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              s === step ? "bg-primary" : s < step ? "bg-primary/40" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Content area: fixed height so layout never shifts (same approach as VoiceDemo) */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* Step 1: Amount */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            <p className="text-xs text-muted-foreground mb-2">¿Cuánto gastaste?</p>
            <motion.p
              className="text-3xl font-black text-foreground mb-4"
              key={amount}
            >
              ${amount || "0"}
            </motion.p>
            <div className="grid grid-cols-4 gap-1 max-w-[160px] mx-auto">
              {keypadNumbers.slice(0, 8).map((num) => (
                <div
                  key={num}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                    amount.includes(num) ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Category */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <p className="text-xs text-muted-foreground mb-3 text-center">Categoría</p>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.label}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: selectedCategory === i ? 1.05 : 1,
                    opacity: 1,
                  }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                    selectedCategory === i
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center mb-1`}>
                    <cat.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{cat.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3"
            >
              <span className="text-2xl">✓</span>
            </motion.div>
            <p className="text-sm font-bold text-foreground mb-1">¡Registrado!</p>
            <p className="text-xs text-muted-foreground">Supermercado - $15.500</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
