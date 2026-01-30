import { motion } from "framer-motion";
import { Mic, ShoppingCart, Check } from "lucide-react";

export const AppleVoiceSection = () => {
  return (
    <section className="py-24 md:py-32 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-foreground tracking-tight leading-tight">
            Hablá.
            <br />
            <span className="text-muted-foreground">Registrá.</span>
          </h2>
        </motion.div>
        
        {/* Voice Demo Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative"
        >
          {/* Phone Frame */}
          <div className="max-w-sm mx-auto">
            <div className="bg-foreground rounded-[2.5rem] p-3 shadow-stripe-lg">
              <div className="bg-background rounded-[2rem] overflow-hidden">
                {/* Dynamic Island */}
                <div className="flex justify-center pt-3 pb-4 bg-background">
                  <div className="w-24 h-7 bg-foreground rounded-full" />
                </div>
                
                {/* Voice Recording UI */}
                <div className="px-6 pb-8 space-y-6">
                  {/* Transcription */}
                  <div className="text-center space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Transcripción
                    </p>
                    <p className="text-xl font-medium text-foreground leading-relaxed">
                      "Gasté cuarenta mil en el supermercado"
                    </p>
                  </div>
                  
                  {/* Waveform - Static iOS style */}
                  <div className="flex items-center justify-center gap-1 h-16 py-4">
                    {[0.3, 0.5, 0.8, 1, 0.7, 0.9, 0.6, 0.4, 0.7, 0.5, 0.8, 0.6, 0.4, 0.3].map((height, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-primary rounded-full"
                        initial={{ height: 8 }}
                        whileInView={{ height: height * 40 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.03, duration: 0.4 }}
                      />
                    ))}
                  </div>
                  
                  {/* Result Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="bg-card rounded-2xl p-4 border border-border shadow-stripe"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-warning/10">
                        <ShoppingCart className="w-5 h-5 text-warning" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Supermercado</p>
                        <p className="text-lg font-bold text-destructive">-$40.000</p>
                      </div>
                      <div className="p-2 rounded-full bg-success/10">
                        <Check className="w-4 h-4 text-success" />
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Mic Button */}
                  <div className="flex justify-center pt-2">
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-stripe-lg">
                      <Mic className="w-7 h-7 text-primary-foreground" />
                    </div>
                  </div>
                </div>
                
                {/* Home Indicator */}
                <div className="flex justify-center pb-2">
                  <div className="w-32 h-1 bg-foreground rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
