import { AppLayout } from "@/components/AppLayout";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { InsightsSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useInsightsData } from "@/hooks/useInsightsData";
import { useAccountAge } from "@/hooks/useAccountAge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

const Insights = () => {
  const isMobile = useIsMobile();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const { hasMinimumUsage, daysRemaining } = useAccountAge();
  const { data, loading: insightsLoading, refetch } = useInsightsData(userId, hasMinimumUsage);

  if (authLoading) {
    return (
      <AppLayout>
        <InsightsSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch pb-[calc(72px+env(safe-area-inset-bottom,0)+0.75rem)] md:pb-0">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 pt-safe pb-3 transition-all duration-300">
          <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
            <div className="h-10 flex items-center">
              <h1 className="text-xl font-bold tracking-tight">Insights</h1>
            </div>
          </div>
        </header>

        <main className={cn("p-4 md:p-6 mx-auto", isMobile ? "max-w-4xl" : "max-w-7xl")}>
          {!hasMinimumUsage ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center">
                <Lock className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Los insights se desbloquean con más uso</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Necesitamos al menos 2 meses de datos para generar análisis útiles. Seguí registrando tus gastos e ingresos.
              </p>
              <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                {daysRemaining === 1 ? "Falta 1 día" : `Faltan ${daysRemaining} días`}
              </span>
            </div>
          ) : (
            <InsightsPanel
              insights={data?.insights || []}
              loading={insightsLoading}
              metadata={data?.metadata || null}
              onRefresh={refetch}
            />
          )}
        </main>
      </div>
    </AppLayout>
  );
};

export default Insights;
