import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PiggyBank, PieChart, TrendingUp, ChevronRight, TrendingDown, ArrowRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

// Mockup Components for "Premium iOS" feel
const iPhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative mx-auto border-[6px] border-slate-950/10 rounded-[3rem] p-2 bg-slate-950/[0.02] shadow-2xl w-[280px] h-[520px] overflow-hidden backdrop-blur-sm">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-20" />
    <div className="bg-background w-full h-full rounded-[2.2rem] overflow-hidden relative flex flex-col text-left border border-slate-950/5">
      {children}
    </div>
  </div>
);

const DashboardMockup = () => (
  <iPhoneFrame>
    <div className="p-4 pt-10 space-y-6">
      <div className="space-y-1 text-center">
        <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Balance Neto</p>
        <p className="text-3xl font-black tracking-tight text-success">$ 4.829.100</p>
        <p className="text-[9px] font-medium text-muted-foreground opacity-80">(USD 3.200 + ARS 1.250.000)</p>
      </div>
      
      <div className="flex justify-center gap-2">
        <div className="px-4 py-1.5 text-[10px] font-bold bg-muted rounded-full">Enero 2026</div>
      </div>

      <div className="space-y-3">
        <div className="bg-card rounded-xl p-3 border border-border shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-success/10"><TrendingUp className="h-3 w-3 text-success" /></div>
            <div>
              <p className="text-[8px] font-medium text-muted-foreground">Ingresos</p>
              <p className="text-xs font-bold text-success">$ 1.200.000</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-destructive/10"><TrendingDown className="h-3 w-3 text-destructive" /></div>
            <div>
              <p className="text-[8px] font-medium text-muted-foreground">Gastos</p>
              <p className="text-xs font-bold text-destructive">$ 450.000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </iPhoneFrame>
);

const AnalysisMockup = () => (
  <iPhoneFrame>
    <div className="p-4 pt-10 space-y-6">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <h2 className="text-sm font-bold tracking-tight">Insights</h2>
      </div>
      
      <div className="space-y-4">
        {[
          { label: "Supermercado", value: "$ 85.000", color: "bg-chart-1", width: "w-[75%]" },
          { label: "Restaurantes", value: "$ 42.000", color: "bg-chart-2", width: "w-[45%]" },
          { label: "Transporte", value: "$ 15.000", color: "bg-chart-3", width: "w-[20%]" },
          { label: "Servicios", value: "$ 60.000", color: "bg-chart-4", width: "w-[55%]" },
        ].map((item, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold">
              <span>{item.label}</span>
              <span className="text-muted-foreground">{item.value}</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${item.color}`} 
                initial={{ width: 0 }}
                animate={{ width: item.width.replace('w-[', '').replace(']', '') }}
                transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-primary/10"><CreditCard className="h-3 w-3 text-primary" /></div>
          <p className="text-[10px] font-bold">Tarjetas de Crédito</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">Visa Santander</span>
            <span className="text-[9px] font-bold text-destructive">$ 120.400</span>
          </div>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-destructive w-[80%]" />
          </div>
        </div>
      </div>
    </div>
  </iPhoneFrame>
);

const PatrimonyMockup = () => (
  <iPhoneFrame>
    <div className="p-4 pt-10 space-y-6">
      <div className="space-y-1">
        <h2 className="text-sm font-bold tracking-tight">Ahorros e Inversiones</h2>
        <p className="text-[9px] text-muted-foreground">Tu patrimonio consolidado</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border shadow-stripe-lg space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-bold text-primary">USD 6.586 / ARS 1.401.119</p>
          </div>
          <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">Líquidos</span>
        </div>
        
        <div className="h-[1px] w-full bg-border/50" />

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-bold text-primary">USD 12.400 / ARS 800.000</p>
          </div>
          <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">Invertidos</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/30 p-3 rounded-xl space-y-1">
          <p className="text-[8px] text-muted-foreground font-bold uppercase">Meta Ahorro</p>
          <p className="text-xs font-bold text-primary">75%</p>
          <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[75%]" />
          </div>
        </div>
        <div className="bg-muted/30 p-3 rounded-xl space-y-1">
          <p className="text-[8px] text-muted-foreground font-bold uppercase">Rendimiento</p>
          <p className="text-xs font-bold text-success">+4.2%</p>
          <div className="h-1 w-full bg-success/20 rounded-full overflow-hidden">
            <div className="h-full bg-success w-[40%]" />
          </div>
        </div>
      </div>
    </div>
  </iPhoneFrame>
);

const ONBOARDING_STEPS = [
  {
    title: "Tené tus finanzas claras",
    subtitle: "Registrá ingresos y gastos en pesos y dólares, todo en un solo lugar",
    mockup: <DashboardMockup />,
    color: "bg-slate-50"
  },
  {
    title: "Entendé tus gastos de verdad",
    subtitle: "Categorías, tarjetas y resúmenes para analizar cada movimiento",
    mockup: <AnalysisMockup />,
    color: "bg-slate-50"
  },
  {
    title: "Tu patrimonio, siempre actualizado",
    subtitle: "Ahorros, inversiones y balances consolidados en pesos",
    mockup: <PatrimonyMockup />,
    color: "bg-slate-50"
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleFinish = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      // Ignore errors if not running on native
    }
    localStorage.setItem("clarita_onboarding_seen", "true");
    navigate("/auth");
    // Force a reload or a state update in App.tsx to show the actual app
    window.location.reload();
  };

  const nextStep = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Ignore errors if not running on native
    }
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${step.color} transition-colors duration-500`}>
      {/* Botón Omitir */}
      <div className="flex justify-end p-6 pt-safe">
        <button 
          onClick={handleFinish}
          className="text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
        >
          Omitir
        </button>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col items-center justify-start pt-4 px-8 text-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className="flex flex-col items-center"
          >
            <div className="mb-10 pointer-events-none drop-shadow-2xl">
              {step.mockup}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                {step.title}
              </h1>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[260px] mx-auto">
                {step.subtitle}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer: Indicadores y Botón */}
      <div className="p-8 safe-area-bottom flex flex-col items-center gap-6 bg-gradient-to-t from-slate-200/50 to-transparent">
        {/* Dots */}
        <div className="flex gap-2">
          {ONBOARDING_STEPS.map((_, i) => (
            <div 
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep ? "w-6 bg-primary" : "w-1.5 bg-slate-300"
              }`}
            />
          ))}
        </div>

        <Button 
          onClick={nextStep}
          className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 border-none active:scale-[0.98] transition-transform"
        >
          {currentStep === ONBOARDING_STEPS.length - 1 ? "Comenzar" : "Siguiente"}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
