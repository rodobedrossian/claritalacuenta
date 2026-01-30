import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { TrendingUp, TrendingDown, PiggyBank, LayoutDashboard, Receipt, CreditCard, Plus } from "lucide-react";

export const ApplePhoneMockup = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -30]);

  return (
    <motion.div 
      ref={ref}
      style={{ y }}
      className="relative mx-auto"
    >
      {/* Large diffuse shadow using design tokens */}
      <div className="absolute inset-0 translate-y-8 scale-95 bg-foreground/10 blur-3xl rounded-[3rem]" />
      
      {/* iPhone Frame */}
      <div className="relative bg-foreground rounded-[3rem] p-3 shadow-stripe-lg">
        {/* Screen */}
        <div className="bg-background rounded-[2.25rem] overflow-hidden">
          {/* Dynamic Island */}
          <div className="flex justify-center pt-3 pb-2 bg-background">
            <div className="w-28 h-8 bg-foreground rounded-full" />
          </div>
          
          {/* App Content - Real Dashboard Preview */}
          <div className="px-5 pb-4 pt-2 space-y-3">
            {/* Header */}
            <div className="text-center py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Enero 2026</p>
              <h2 className="text-2xl font-bold text-foreground mt-1">$847.500</h2>
              <p className="text-xs text-muted-foreground">Balance del mes</p>
            </div>
            
            {/* Quick Stats - Matching real app design */}
            <div className="space-y-2">
              {/* Income Card */}
              <div className="bg-card rounded-xl p-3 border border-border shadow-stripe">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-success/10">
                    <TrendingUp className="w-3.5 h-3.5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-medium text-muted-foreground">Ingresos del mes</p>
                    <p className="text-sm font-bold text-success">$1.200.000</p>
                  </div>
                </div>
              </div>
              
              {/* Expense Card */}
              <div className="bg-card rounded-xl p-3 border border-border shadow-stripe">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-destructive/10">
                    <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-medium text-muted-foreground">Gastos del mes</p>
                    <p className="text-sm font-bold text-destructive">$352.500</p>
                  </div>
                </div>
              </div>
              
              {/* Savings Card */}
              <div className="bg-card rounded-xl p-3 border border-border shadow-stripe">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <PiggyBank className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-medium text-muted-foreground">Ahorros</p>
                    <p className="text-sm font-bold text-primary">USD 2.500</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Navigation - Matching real app */}
            <div className="bg-background/80 backdrop-blur-xl border-t border-border pt-2 -mx-5 px-5">
              <div className="flex items-center justify-around">
                <div className="flex flex-col items-center gap-1">
                  <LayoutDashboard className="w-5 h-5 text-primary" strokeWidth={2.5} />
                  <span className="text-[8px] font-bold text-primary">Inicio</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Receipt className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[8px] font-bold text-muted-foreground/80">Movimientos</span>
                </div>
                <div className="-mt-4">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-stripe-lg border-2 border-background">
                    <Plus className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[8px] font-bold text-muted-foreground/80">Tarjetas</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <PiggyBank className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[8px] font-bold text-muted-foreground/80">Ahorros</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Home Indicator */}
          <div className="flex justify-center pb-2">
            <div className="w-32 h-1 bg-foreground rounded-full" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
