import { motion } from "framer-motion";
import { Calendar, DollarSign, CreditCard, Receipt } from "lucide-react";

const categoryData = [
  { name: "Vacaciones", amount: 1570000, color: "hsl(250, 84%, 54%)", percentage: 29 },
  { name: "Compras", amount: 813000, color: "hsl(142, 71%, 45%)", percentage: 15 },
  { name: "Salidas", amount: 746000, color: "hsl(24, 95%, 53%)", percentage: 14 },
  { name: "Supermercado", amount: 578000, color: "hsl(45, 93%, 47%)", percentage: 11 },
  { name: "Auto", amount: 432000, color: "hsl(188, 94%, 43%)", percentage: 8 },
  { name: "Otros", amount: 1261000, color: "hsl(340, 82%, 52%)", percentage: 23 },
];

const stats = [
  { label: "Total ARS", value: "$5.4M", icon: DollarSign, color: "text-primary" },
  { label: "Total USD", value: "U$D 133", icon: DollarSign, color: "text-success" },
  { label: "Transacciones", value: "160", icon: Receipt, color: "text-amber-500" },
  { label: "Tarjetas", value: "3", icon: CreditCard, color: "text-purple-500" },
];

export const MonthlyAnalyticsMockup = () => {
  // Calculate cumulative offsets for donut chart
  let cumulativePercentage = 0;
  const segments = categoryData.map((cat) => {
    const offset = cumulativePercentage;
    cumulativePercentage += cat.percentage;
    return { ...cat, offset };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-card rounded-2xl border border-border/50 shadow-stripe overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Enero 2026</span>
        </div>
        <div className="flex items-center gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-1.5"
            >
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <span className="text-xs font-medium text-muted-foreground">{stat.value}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-8">
          {/* Donut Chart */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {segments.map((segment, i) => {
                const circumference = 2 * Math.PI * 35;
                const strokeDasharray = (segment.percentage / 100) * circumference;
                const strokeDashoffset = -(segment.offset / 100) * circumference;
                
                return (
                  <motion.circle
                    key={segment.name}
                    cx="50"
                    cy="50"
                    r="35"
                    fill="transparent"
                    stroke={segment.color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    whileInView={{ strokeDasharray: `${strokeDasharray} ${circumference}` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                    style={{ strokeDashoffset }}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">$5.4M</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 grid grid-cols-2 gap-2">
            {categoryData.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-center gap-2"
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{cat.name}</p>
                  <p className="text-sm font-semibold text-foreground">
                    ${(cat.amount / 1000).toFixed(0)}K
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
