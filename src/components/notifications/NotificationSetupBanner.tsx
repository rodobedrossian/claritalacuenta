import { Bell, Smartphone, X, Monitor, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Capacitor } from "@capacitor/core";

interface NotificationSetupBannerProps {
  isSupported: boolean;
  isPWA: boolean;
  platform: 'android' | 'ios' | 'desktop';
  hasSubscription: boolean;
  permission: NotificationPermission;
  onSubscribe: () => Promise<boolean>;
  subscribing: boolean;
}

export function NotificationSetupBanner({
  isSupported,
  isPWA,
  platform,
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

  // Android can receive notifications without PWA installation
  // Show direct subscription prompt for Android
  if (platform === 'android' && isSupported) {
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
                  Recibe alertas de presupuesto, recordatorios de gastos y más directamente en tu Android.
                </p>
                {!isPWA && (
                  <p className="text-xs text-muted-foreground/70 mt-2 flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    Tip: Instala la app desde el menú (⋮) → "Instalar app" para mejor experiencia
                  </p>
                )}
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

  // iOS requires PWA installation first
  if (platform === 'ios' && !isPWA && isSupported && !Capacitor.isNativePlatform()) {
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

  // Capacitor / Native iOS - show subscription prompt directly
  if (platform === 'ios' && Capacitor.isNativePlatform() && isSupported) {
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
                  Recibe alertas de presupuesto, recordatorios de gastos y más directamente en tu iPhone.
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

  // Desktop can receive notifications without PWA
  if (platform === 'desktop' && isSupported) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Activa las notificaciones de escritorio</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Recibe alertas de presupuesto y recordatorios de gastos en tu computadora.
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

  // iOS PWA - show subscription prompt
  if (platform === 'ios' && isPWA && isSupported) {
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
                  Recibe alertas de presupuesto, recordatorios de gastos y más directamente en tu iPhone.
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
