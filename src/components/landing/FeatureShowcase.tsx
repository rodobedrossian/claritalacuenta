import { motion } from "framer-motion";
import { Mic, Calculator, FileText, BarChart3, DollarSign, PiggyBank } from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import { VoiceDemo } from "./VoiceDemo";
import { WizardMockup } from "./WizardMockup";
export const FeatureShowcase = () => {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.5,
          }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
            Todo lo que necesitás para{" "}
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              controlar tus finanzas
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Desde registrar un café hasta analizar tus gastos mensuales. Simple, rápido y sin vueltas.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1: Manual registration */}
          <FeatureCard
            title="Registrá en segundos"
            description="3 simples pasos: monto, categoría y listo."
            icon={<Calculator className="w-6 h-6 text-primary-foreground" />}
            index={0}
            gradient="from-blue-500/5 to-cyan-500/5"
          >
            <WizardMockup />
          </FeatureCard>

          {/* Feature 2: Voice registration */}
          <FeatureCard
            title="Hablale a Rucula"
            description="Dictá tu gasto y la IA lo interpreta. 'Gasté 40 lucas en el super' y listo."
            icon={<Mic className="w-6 h-6 text-primary-foreground" />}
            index={1}
            gradient="from-pink-500/5 to-rose-500/5"
          >
            <VoiceDemo />
          </FeatureCard>

          {/* Feature 3: Statement import */}
          <FeatureCard
            title="Importá tus resúmenes"
            description="Subí el PDF de tu tarjeta y la IA extrae todas las transacciones automáticamente."
            icon={<FileText className="w-6 h-6 text-primary-foreground" />}
            index={2}
            gradient="from-emerald-500/5 to-green-500/5"
          >
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-dashed border-primary/30">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">resumen_visa.pdf</p>
                  <p className="text-xs text-muted-foreground">15 transacciones detectadas</p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  {
                    name: "Mercado Libre",
                    amount: "-$45.320",
                  },
                  {
                    name: "Spotify",
                    amount: "-$2.299",
                  },
                  {
                    name: "Uber",
                    amount: "-$8.750",
                  },
                ].map((tx, i) => (
                  <motion.div
                    key={tx.name}
                    initial={{
                      opacity: 0,
                      x: -10,
                    }}
                    whileInView={{
                      opacity: 1,
                      x: 0,
                    }}
                    viewport={{
                      once: true,
                    }}
                    transition={{
                      delay: 0.5 + i * 0.1,
                    }}
                    className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-muted/50"
                  >
                    <span className="text-muted-foreground">{tx.name}</span>
                    <span className="font-medium text-foreground">{tx.amount}</span>
                  </motion.div>
                ))}
              </div>

              <p className="text-center text-xs text-primary font-medium">✨ Procesado con IA</p>
            </div>
          </FeatureCard>

          {/* Feature 4: Analytics */}
          <FeatureCard
            title="Entendé tus gastos"
            description="Charts claros, insights útiles y presupuestos que te avisan cuando te estás pasando."
            icon={<BarChart3 className="w-6 h-6 text-primary-foreground" />}
            index={3}
            gradient="from-amber-500/5 to-orange-500/5"
          >
            <div className="bg-muted/30 rounded-xl p-4">
              {/* Mini chart */}
              <div className="flex items-end justify-between h-20 gap-1 mb-3">
                {[40, 65, 35, 80, 55, 70, 45].map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      height: 0,
                    }}
                    whileInView={{
                      height: `${height}%`,
                    }}
                    viewport={{
                      once: true,
                    }}
                    transition={{
                      delay: 0.3 + i * 0.05,
                      duration: 0.4,
                    }}
                    className="flex-1 bg-gradient-to-t from-primary to-primary/60 rounded-t"
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Lun</span>
                <span>Mar</span>
                <span>Mié</span>
                <span>Jue</span>
                <span>Vie</span>
                <span>Sáb</span>
                <span>Dom</span>
              </div>
            </div>
          </FeatureCard>

          {/* Feature 5: Multi-currency */}
          <FeatureCard
            title="Pesos y dólares"
            description="Llevá el control en ambas monedas. Cotización actualizada y patrimonio consolidado."
            icon={<DollarSign className="w-6 h-6 text-primary-foreground" />}
            index={4}
            gradient="from-green-500/5 to-emerald-500/5"
          >
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <div className="flex justify-center gap-2">
                <motion.div
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                  whileHover={{
                    scale: 1.05,
                  }}
                >
                  ARS
                </motion.div>
                <motion.div
                  className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium"
                  whileHover={{
                    scale: 1.05,
                  }}
                >
                  USD
                </motion.div>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">Patrimonio total</p>
                <p className="text-xl font-black text-foreground">$2.847.520</p>
                <p className="text-xs text-success">≈ USD 2.456</p>
              </div>

              <div className="text-center text-xs text-muted-foreground">1 USD = $1.521 (USDC)</div>
            </div>
          </FeatureCard>

          {/* Feature 6: Savings */}
          <FeatureCard
            title="Metas de ahorro"
            description="Definí objetivos, seguí tu progreso y celebrá cuando los alcances."
            icon={<PiggyBank className="w-6 h-6 text-primary-foreground" />}
            index={5}
            gradient="from-cyan-500/5 to-teal-500/5"
          >
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              {[
                {
                  name: "Viaje a Europa",
                  progress: 65,
                  target: "USD 3.000",
                },
                {
                  name: "Fondo de emergencia",
                  progress: 88,
                  target: "$500.000",
                },
              ].map((goal, i) => (
                <motion.div
                  key={goal.name}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay: 0.4 + i * 0.1,
                  }}
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{goal.name}</span>
                    <span className="font-medium text-foreground">{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      whileInView={{
                        width: `${goal.progress}%`,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        duration: 0.8,
                        delay: 0.5 + i * 0.1,
                      }}
                      className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Meta: {goal.target}</p>
                </motion.div>
              ))}
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
};
