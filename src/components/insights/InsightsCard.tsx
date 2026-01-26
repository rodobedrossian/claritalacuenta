import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightItem } from "./InsightItem";
import type { Insight } from "@/hooks/useInsightsData";
import { motion } from "framer-motion";

interface InsightsCardProps {
  insights: Insight[];
  loading: boolean;
  onRefresh: () => void;
}

export function InsightsCard({ insights, loading }: InsightsCardProps) {
  const navigate = useNavigate();

  // Show only the first/most important insight
  const topInsight = insights[0];
  const hasMore = insights.length > 1;

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/40">
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    );
  }

  if (!topInsight) {
    return null; // Don't show anything if no insights
  }

  return (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Sugerencias</h3>
        {hasMore && (
          <button 
            onClick={() => navigate("/insights")}
            className="text-[10px] font-bold text-primary uppercase tracking-wider hover:opacity-70 transition-opacity"
          >
            Ver {insights.length} total
          </button>
        )}
      </div>

      {/* Single insight - compact */}
      <InsightItem insight={topInsight} compact />
    </motion.div>
  );
}
