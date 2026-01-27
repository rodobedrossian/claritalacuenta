import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, TrendingUp, Lightbulb, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const tabs = ["Todos", "Anomalías", "Patrones", "Tendencias", "Consejos"];

const insights = [
  {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    priority: "ALTA",
    priorityColor: "bg-destructive/10 text-destructive",
    type: "ANOMALÍA",
    typeColor: "bg-amber-500/10 text-amber-600",
    category: "AUTO",
    categoryColor: "bg-blue-500/10 text-blue-600",
    title: "Auto: gasto inusual detectado",
    description: "Más compras (+50%) y ticket promedio más alto (+93%) vs. promedio histórico",
  },
  {
    icon: RefreshCw,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    priority: "ALTA",
    priorityColor: "bg-destructive/10 text-destructive",
    type: "PATRÓN",
    typeColor: "bg-primary/10 text-primary",
    title: "Desglose de consumos TC: $3.28M",
    description: "Supermercado 26%, Compras 23%, Auto 18%, Salidas 15%",
  },
  {
    icon: RefreshCw,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    priority: "MEDIA",
    priorityColor: "bg-amber-500/10 text-amber-600",
    type: "PATRÓN",
    typeColor: "bg-primary/10 text-primary",
    category: "SUPERMERCADO",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "Jumbo Martinez es recurrente",
    description: "8 visitas este mes, ticket promedio $147K cada vez",
  },
  {
    icon: TrendingUp,
    iconColor: "text-success",
    iconBg: "bg-success/10",
    priority: "BAJA",
    priorityColor: "bg-muted text-muted-foreground",
    type: "TENDENCIA",
    typeColor: "bg-success/10 text-success",
    title: "Gastos en delivery bajaron 23%",
    description: "Pasaste de $89K a $68K comparado con el mes anterior",
  },
];

export const InsightsMockup = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-card rounded-2xl border border-border/50 shadow-stripe overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Análisis inteligente</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            4 insights
          </Badge>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab, i) => (
            <motion.button
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                i === 0 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Insights List */}
      <div className="p-4 space-y-3">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className={`w-9 h-9 rounded-lg ${insight.iconBg} flex items-center justify-center flex-shrink-0`}>
              <insight.icon className={`w-4 h-4 ${insight.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              {/* Badges Row */}
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                <Badge className={`${insight.priorityColor} text-[9px] uppercase font-bold border-0 px-1.5 py-0`}>
                  {insight.priority}
                </Badge>
                <Badge className={`${insight.typeColor} text-[9px] uppercase font-bold border-0 px-1.5 py-0`}>
                  {insight.type}
                </Badge>
                {insight.category && (
                  <Badge className={`${insight.categoryColor} text-[9px] uppercase font-bold border-0 px-1.5 py-0`}>
                    {insight.category}
                  </Badge>
                )}
              </div>
              <h5 className="text-sm font-semibold text-foreground mb-0.5 truncate">
                {insight.title}
              </h5>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {insight.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
