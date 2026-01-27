import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const ONBOARDING_KEY = "clarita_onboarding_seen";

// --- Mock Components for Premium iOS Previews ---

const DashboardPreview = () => (
  <Card className="w-64 overflow-hidden border-border/40 shadow-xl bg-white rounded-[2.5rem] p-4 space-y-4 pointer-events-none select-none origin-bottom scale-90 sm:scale-100">
    <div className="space-y-1">
      <div className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest">Balance neto</div>
      <div className="text-3xl font-black text-success tracking-tight">ARS 4.333.140</div>
      <div className="text-[9px] text-muted-foreground font-medium opacity-70">(USD 6.109,62 + ARS -4.929.044,12)</div>
    </div>
    
    <div className="flex justify-center gap-2">
      <div className="px-3 py-1 rounded-full bg-muted text-[10px] font-bold">Enero 2026</div>
    </div>

    <div className="space-y-2">
      <div className="p-3 rounded-2xl bg-success/5 border border-success/10 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-success/10 text-success">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-[9px] font-bold text-muted-foreground/60 uppercase">Ingresos</div>
          <div className="text-sm font-bold text-success">ARS 11.655.943</div>
        </div>
      </div>
      <div className="p-3 rounded-2xl bg-destructive/5 border border-destructive/10 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
          <TrendingDown className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-[9px] font-bold text-muted-foreground/60 uppercase">Gastos</div>
          <div className="text-sm font-bold text-destructive">ARS 7.322.803</div>
        </div>
      </div>
    </div>
  </Card>
);

const ExpensesPreview = () => (
  <Card className="w-64 overflow-hidden border-border/40 shadow-xl bg-white rounded-[2.5rem] p-4 space-y-4 pointer-events-none select-none origin-bottom scale-90 sm:scale-100">
    <div className="flex items-center justify-between">
      <div className="text-sm font-bold tracking-tight text-foreground">Análisis de gastos</div>
      <Sparkles className="h-4 w-4 text-primary" />
    </div>
    
    <div className="relative h-32 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full border-[12px] border-primary/10" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full border-[12px] border-primary border-t-transparent border-r-transparent rotate-45" />
      </div>
      <div className="text-center">
        <div className="text-xs font-bold">Total</div>
        <div className="text-[10px] text-muted-foreground">$7.3M</div>
      </div>
    </div>

    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] p-2 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-medium text-muted-foreground">Supermercado</span>
        </div>
        <span className="font-bold">35%</span>
      </div>
      <div className="flex items-center justify-between text-[10px] p-2 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-400" />
          <span className="font-medium text-muted-foreground">Restaurantes</span>
        </div>
        <span className="font-bold">22%</span>
      </div>
    </div>
  </Card>
);

const SavingsPreview = () => (
  <Card className="w-64 overflow-hidden border-border/40 shadow-xl bg-white rounded-[2.5rem] p-4 space-y-4 pointer-events-none select-none origin-bottom scale-90 sm:scale-100">
    <div className="space-y-1">
      <div className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest text-center">Ahorros totales</div>
      <div className="space-y-0.5 text-center">
        <div className="text-xl font-black text-primary tracking-tight">USD 6.586 <span className="text-[9px] font-bold opacity-40 uppercase tracking-wider">líquidos</span></div>
        <div className="text-xl font-black text-primary tracking-tight">ARS 1.401.119 <span className="text-[9px] font-bold opacity-40 uppercase tracking-wider">invertidos</span></div>
      </div>
    </div>

    <div className="p-4 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold text-muted-foreground/60">META DE AHORRO</div>
        <div className="text-[10px] font-black text-primary">75%</div>
      </div>
      <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
        <div className="h-full w-3/4 bg-primary rounded-full" />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div className="p-3 rounded-2xl bg-muted/30 text-center">
        <div className="text-[8px] font-bold text-muted-foreground/60 uppercase">Rendimiento</div>
        <div className="text-xs font-bold text-success">+4.2%</div>
      </div>
      <div className="p-3 rounded-2xl bg-muted/30 text-center">
        <div className="text-[8px] font-bold text-muted-foreground/60 uppercase">Activos</div>
        <div className="text-xs font-bold">12</div>
      </div>
    </div>
  </Card>
);

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      title: "Tené tus finanzas claras",
      subtitle: "Registrá ingresos y gastos en pesos y dólares, todo en un solo lugar",
      visual: <DashboardPreview />,
    },
    {
      title: "Entendé tus gastos de verdad",
      subtitle: "Categorías, tarjetas y resúmenes para analizar cada movimiento",
      visual: <ExpensesPreview />,
    },
    {
      title: "Tu patrimonio, siempre actualizado",
      subtitle: "Ahorros, inversiones y balances consolidados en pesos",
      visual: <SavingsPreview />,
    },
  ];

  const triggerHaptic = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (e) {
        console.error("Haptics error", e);
      }
    }
  };

  const nextStep = () => {
    triggerHaptic();
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    navigate("/auth");
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-violet-50 to-white overflow-hidden">
      {/* Skip Button */}
      <div className="absolute top-0 right-0 p-6 pt-safe">
        <button 
          onClick={finishOnboarding}
          className="text-xs font-bold text-primary/60 hover:text-primary transition-colors tracking-widest uppercase p-2"
        >
          Omitir
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="w-full flex flex-col items-center space-y-12"
          >
            {/* Visual Container */}
            <div className="relative py-8">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-[60px] transform scale-150" />
              <div className="relative z-10 drop-shadow-2xl">
                {steps[step].visual}
              </div>
            </div>

            {/* Text Content */}
            <div className="space-y-4 max-w-sm">
              <h1 className="text-2xl font-black text-violet-950 tracking-tight leading-tight">
                {steps[step].title}
              </h1>
              <p className="text-sm font-medium text-violet-900/60 leading-relaxed px-4">
                {steps[step].subtitle}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Controls */}
      <div className="p-8 pb-safe-area-bottom w-full flex flex-col items-center space-y-8 bg-white/50 backdrop-blur-sm border-t border-violet-100/50">
        {/* Step Indicators */}
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div 
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === i ? "w-8 bg-primary shadow-glow" : "w-1.5 bg-primary/20"
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <Button 
          onClick={nextStep}
          className="w-full max-w-sm h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
        >
          {step === steps.length - 1 ? "Comenzar" : "Siguiente"}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
