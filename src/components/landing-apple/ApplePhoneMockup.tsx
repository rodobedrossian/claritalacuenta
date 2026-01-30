import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { TrendingUp, TrendingDown, CreditCard, PiggyBank } from "lucide-react";

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
      {/* Large diffuse shadow */}
      <div className="absolute inset-0 translate-y-8 scale-95 bg-black/10 blur-3xl rounded-[3rem]" />
      
      {/* iPhone Frame */}
      <div className="relative bg-[#1D1D1F] rounded-[3rem] p-3 shadow-2xl">
        {/* Screen */}
        <div className="bg-white rounded-[2.25rem] overflow-hidden">
          {/* Dynamic Island */}
          <div className="flex justify-center pt-3 pb-2 bg-white">
            <div className="w-28 h-8 bg-[#1D1D1F] rounded-full" />
          </div>
          
          {/* App Content */}
          <div className="px-5 pb-8 pt-2 space-y-4">
            {/* Header */}
            <div className="text-center py-2">
              <p className="text-[10px] text-[#86868B] uppercase tracking-wider">Enero 2026</p>
              <h2 className="text-2xl font-bold text-[#1D1D1F] mt-1">$847.500</h2>
              <p className="text-xs text-[#86868B]">Balance del mes</p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F5F5F7] rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-[10px] text-[#86868B]">Ingresos</span>
                </div>
                <p className="text-sm font-semibold text-[#1D1D1F]">$1.200.000</p>
              </div>
              
              <div className="bg-[#F5F5F7] rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  </div>
                  <span className="text-[10px] text-[#86868B]">Gastos</span>
                </div>
                <p className="text-sm font-semibold text-[#1D1D1F]">$352.500</p>
              </div>
            </div>
            
            {/* Mini Chart */}
            <div className="bg-[#F5F5F7] rounded-2xl p-3">
              <p className="text-[10px] text-[#86868B] mb-2">Gastos por categoría</p>
              <div className="flex items-end justify-between gap-1 h-16">
                {[65, 45, 80, 35, 55, 40, 70].map((height, i) => (
                  <div 
                    key={i}
                    className="flex-1 bg-[#0071E3] rounded-sm opacity-80"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex justify-around py-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-[#0071E3] flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <span className="text-[9px] text-[#86868B]">Tarjetas</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-[#1D1D1F] flex items-center justify-center">
                  <PiggyBank className="w-4 h-4 text-white" />
                </div>
                <span className="text-[9px] text-[#86868B]">Ahorros</span>
              </div>
            </div>
          </div>
          
          {/* Home Indicator */}
          <div className="flex justify-center pb-2">
            <div className="w-32 h-1 bg-[#1D1D1F] rounded-full" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
