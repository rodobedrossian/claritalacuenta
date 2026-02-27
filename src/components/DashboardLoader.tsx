import { RuculaLogo } from "@/components/RuculaLogo";
import { AppLayout } from "@/components/AppLayout";

/**
 * Loader mostrado mientras se obtienen el workspace y los datos del dashboard.
 * Overlay a pantalla completa (cubre botonera en mobile y todo el viewport en web).
 */
export function DashboardLoader() {
  return (
    <AppLayout>
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 px-4 bg-background"
        aria-busy="true"
        aria-label="Cargando dashboard"
      >
        <RuculaLogo size="xl" className="opacity-90" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Cargando tu dashboard…
        </p>
        <div className="flex gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </AppLayout>
  );
}
