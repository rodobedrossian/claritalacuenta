import { motion } from "framer-motion";
import { TrendingDown, Calendar, Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const projectionStats = [
  { 
    label: "Cuotas próximo mes", 
    value: "$567K",
    icon: Calendar,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  { 
    label: "En Mar 2026 liberás", 
    value: "$138K",
    icon: Banknote,
    color: "text-success",
    bgColor: "bg-success/10"
  },
  { 
    label: "En 6 meses baja a", 
    value: "$505K",
    icon: TrendingDown,
    color: "text-success",
    bgColor: "bg-success/10",
    badge: "-89%"
  },
];

const monthlyProjection = [
  { month: "Ene 2026", amount: 567000, percentage: 100 },
  { month: "Feb 2026", amount: 542000, percentage: 96 },
  { month: "Mar 2026", amount: 429000, percentage: 76 },
  { month: "Abr 2026", amount: 385000, percentage: 68 },
  { month: "May 2026", amount: 312000, percentage: 55 },
  { month: "Jun 2026", amount: 245000, percentage: 43 },
];

export const InstallmentProjectionMockup = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="space-y-4"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {projectionStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="bg-card rounded-xl border border-border/50 p-4 shadow-stripe"
          >
            <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center mb-2`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              {stat.badge && (
                <Badge className="bg-success/10 text-success text-[10px] font-bold border-0">
                  {stat.badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Projection Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border/50 p-5 shadow-stripe"
      >
        <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-success" />
          Proyección de cuotas
        </h4>
        <div className="space-y-3">
          {monthlyProjection.map((month, i) => (
            <motion.div
              key={month.month}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-muted-foreground w-16 flex-shrink-0">
                {month.month}
              </span>
              <div className="flex-1 h-6 bg-muted/50 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${month.percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-lg flex items-center justify-end pr-2"
                >
                  <span className="text-[10px] font-medium text-white">
                    ${(month.amount / 1000).toFixed(0)}K
                  </span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
