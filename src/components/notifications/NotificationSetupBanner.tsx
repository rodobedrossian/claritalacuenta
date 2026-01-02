import { Bell, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

interface NotificationSetupBannerProps {
  isSupported: boolean;
  isPWA: boolean;
  hasSubscription: boolean;
  permission: NotificationPermission;
  onSubscribe: () => Promise<boolean>;
  subscribing: boolean;
}

export function NotificationSetupBanner({
  isSupported,
  isPWA,
  hasSubscription,
  permission,
  onSubscribe,
  subscribing,
}: NotificationSetupBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already subscribed, dismissed, or denied
  if (hasSubscription || dismissed || permission === "denied") {
    return null;
  }

  // Show PWA installation instructions if not in standalone mode
  if (!isPWA && isSupported) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Instala la app para notificaciones</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Para recibir notificaciones push en iOS, primero agrega esta app a tu pantalla de inicio:
                </p>
                <ol className="text-xs text-muted-foreground mt-2 list-decimal list-inside space-y-1">
                  <li>Toca el botón <span className="font-medium">Compartir</span> (□↑) en Safari</li>
                  <li>Selecciona <span className="font-medium">"Agregar a pantalla de inicio"</span></li>
                  <li>Abre la app desde el ícono en tu inicio</li>
                </ol>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show subscription prompt for PWA users
  if (isPWA && isSupported) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Activa las notificaciones</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Recibe alertas de presupuesto, recordatorios de gastos y más directamente en tu dispositivo.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissed(true)}
              >
                Ahora no
              </Button>
              <Button
                size="sm"
                onClick={onSubscribe}
                disabled={subscribing}
              >
                {subscribing ? "Activando..." : "Activar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not supported
  return null;
}
