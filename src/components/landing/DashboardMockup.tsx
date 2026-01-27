import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";

const mockCategories = [
  { name: "Supermercado", percentage: 35, color: "hsl(250 84% 54%)" },
  { name: "Transporte", percentage: 20, color: "hsl(280 80% 60%)" },
  { name: "Entretenimiento", percentage: 18, color: "hsl(160 70% 45%)" },
  { name: "Servicios", percentage: 15, color: "hsl(30 90% 55%)" },
  { name: "Otros", percentage: 12, color: "hsl(330 70% 60%)" },
];

export const DashboardMockup = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      className="relative w-full max-w-lg mx-auto"
    >
      {/* Phone frame */}
      <div className="relative bg-card rounded-[2.5rem] p-3 shadow-stripe-lg border border-border/50">
        {/* Screen */}
        <div className="bg-background rounded-[2rem] p-4 space-y-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Balance neto</p>
              <motion.p 
                className="text-2xl font-black text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                $847.520
              </motion.p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <motion.div 
              className="bg-success/10 rounded-xl p-2.5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-[10px] text-success font-medium">Ingresos</span>
              </div>
              <p className="text-sm font-bold text-foreground">$1.250.000</p>
            </motion.div>
            
            <motion.div 
              className="bg-destructive/10 rounded-xl p-2.5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-destructive" />
                <span className="text-[10px] text-destructive font-medium">Gastos</span>
              </div>
              <p className="text-sm font-bold text-foreground">$402.480</p>
            </motion.div>
            
            <motion.div 
              className="bg-primary/10 rounded-xl p-2.5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <div className="flex items-center gap-1 mb-1">
                <PieChart className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-primary font-medium">Ahorros</span>
              </div>
              <p className="text-sm font-bold text-foreground">$320.000</p>
            </motion.div>
          </div>

          {/* Chart section */}
          <motion.div 
            className="bg-muted/30 rounded-xl p-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
          >
            <p className="text-xs font-medium text-foreground mb-3">Gastos por categoría</p>
            <div className="flex items-center gap-4">
              {/* Donut chart */}
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  {mockCategories.map((cat, i) => {
                    const offset = mockCategories.slice(0, i).reduce((acc, c) => acc + c.percentage, 0);
                    return (
                      <motion.circle
                        key={cat.name}
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke={cat.color}
                        strokeWidth="4"
                        strokeDasharray={`${cat.percentage} ${100 - cat.percentage}`}
                        strokeDashoffset={-offset}
                        initial={{ strokeDasharray: "0 100" }}
                        animate={{ strokeDasharray: `${cat.percentage} ${100 - cat.percentage}` }}
                        transition={{ delay: 1.2 + i * 0.1, duration: 0.5 }}
                      />
                    );
                  })}
                </svg>
              </div>
              
              {/* Legend */}
              <div className="flex-1 space-y-1">
                {mockCategories.slice(0, 3).map((cat, i) => (
                  <motion.div 
                    key={cat.name}
                    className="flex items-center justify-between text-[10px]"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.4 + i * 0.1 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{cat.percentage}%</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent transactions preview */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            <p className="text-xs font-medium text-foreground">Últimos movimientos</p>
            {[
              { desc: "Carrefour", amount: "-$45.320", cat: "🛒" },
              { desc: "Transferencia recibida", amount: "+$150.000", cat: "💰" },
            ].map((tx, i) => (
              <motion.div 
                key={i}
                className="flex items-center justify-between bg-muted/20 rounded-lg p-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7 + i * 0.1 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{tx.cat}</span>
                  <span className="text-xs text-muted-foreground">{tx.desc}</span>
                </div>
                <span className={`text-xs font-medium ${tx.amount.startsWith('+') ? 'text-success' : 'text-foreground'}`}>
                  {tx.amount}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Decorative shadow */}
      <div className="absolute -inset-4 bg-gradient-to-b from-primary/10 to-transparent rounded-[3rem] -z-10 blur-2xl" />
    </motion.div>
  );
};
