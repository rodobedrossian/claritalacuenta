import { useState } from "react";
import { Bell, Smartphone, Trash2, Send, Clock, Loader2, RefreshCw, AlertTriangle, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Capacitor } from "@capacitor/core";

interface NotificationSettingsProps {
  isSupported: boolean;
  isPWA: boolean;
  platform: 'android' | 'ios' | 'desktop';
  permission: NotificationPermission;
  subscriptions: Array<{
    id: string;
    endpoint: string;
    device_name: string | null;
    created_at: string;
  }>;
  settings: {
    morning_budget_check: boolean;
    morning_time: string;
    evening_expense_reminder: boolean;
    evening_time: string;
    budget_exceeded_alert: boolean;
    monthly_recurring_reminder: boolean;
    monthly_reminder_day: number;
  };
  loading: boolean;
  subscribing: boolean;
  onSubscribe: () => Promise<boolean>;
  onUnsubscribe: (id: string) => Promise<void>;
  onResetSubscription: () => Promise<boolean>;
  onUpdateSettings: (settings: Partial<NotificationSettingsProps["settings"]>) => Promise<void>;
  onSendTest: () => Promise<void>;
}

// Helper to get device icon based on device name
const getDeviceIcon = (deviceName: string | null) => {
  if (!deviceName) return <Smartphone className="h-4 w-4 text-muted-foreground" />;
  const name = deviceName.toLowerCase();
  if (name.includes('android')) return <Smartphone className="h-4 w-4 text-green-500" />;
  if (name.includes('iphone') || name.includes('ipad')) return <Smartphone className="h-4 w-4 text-blue-500" />;
  if (name.includes('mac') || name.includes('windows') || name.includes('linux')) return <Monitor className="h-4 w-4 text-muted-foreground" />;
  return <Smartphone className="h-4 w-4 text-muted-foreground" />;
};

export function NotificationSettings({
  isSupported,
  isPWA,
  platform,
  permission,
  subscriptions,
  settings,
  loading,
  subscribing,
  onSubscribe,
  onUnsubscribe,
  onResetSubscription,
  onUpdateSettings,
  onSendTest,
}: NotificationSettingsProps) {
  const [sendingTest, setSendingTest] = useState(false);
  const [resetting, setResetting] = useState(false);
  const hasSubscription = subscriptions.length > 0;

  const timeOptions = Array.from({ length: 24 }, (_, i) => ({
    value: `${String(i).padStart(2, "0")}:00:00`,
    label: `${String(i).padStart(2, "0")}:00`,
  }));

  const dayOptions = Array.from({ length: 28 }, (_, i) => ({
    value: i + 1,
    label: `Día ${i + 1}`,
  }));

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Tu navegador no soporta notificaciones push
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificaciones Push
        </CardTitle>
        <CardDescription>
          Configura alertas y recordatorios en tu dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Estado de notificaciones</h4>
              <p className="text-sm text-muted-foreground">
                {permission === "denied" 
                  ? "Bloqueadas en el navegador"
                  : hasSubscription 
                    ? "Activadas" 
                    : "No activadas"}
              </p>
            </div>
            {permission !== "denied" && !hasSubscription && (
              <Button onClick={onSubscribe} disabled={subscribing || (platform === 'ios' && !isPWA && !Capacitor.isNativePlatform())}>
                {subscribing ? "Activando..." : "Activar notificaciones"}
              </Button>
            )}
            {hasSubscription && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    setSendingTest(true);
                    try {
                      await onSendTest();
                    } finally {
                      setSendingTest(false);
                    }
                  }}
                  disabled={sendingTest || resetting}
                >
                  {sendingTest ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {sendingTest ? "Enviando..." : "Probar"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    setResetting(true);
                    try {
                      await onResetSubscription();
                    } finally {
                      setResetting(false);
                    }
                  }}
                  disabled={resetting || sendingTest}
                >
                  {resetting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {resetting ? "Reseteando..." : "Resetear"}
                </Button>
              </div>
            )}
          </div>

          {platform === 'ios' && !isPWA && !Capacitor.isNativePlatform() && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="font-medium mb-1">Para activar notificaciones en iOS:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Toca el botón Compartir (□↑) en Safari</li>
                <li>Selecciona "Agregar a pantalla de inicio"</li>
                <li>Abre la app desde el ícono</li>
              </ol>
            </div>
          )}

          {platform === 'android' && !isPWA && !Capacitor.isNativePlatform() && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="font-medium mb-1">💡 Tip para mejor experiencia:</p>
              <p className="text-muted-foreground">
                Instala la app desde el menú (⋮) → "Instalar app" o "Agregar a pantalla de inicio"
              </p>
            </div>
          )}

          {permission === "denied" && (
            <div className="p-3 rounded-lg bg-destructive/10 text-sm text-destructive">
              Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de tu navegador.
            </div>
        )}

        {/* iOS Troubleshooting Checklist */}
        {hasSubscription && platform === 'ios' && (
          <Alert className="bg-muted/50 border-muted-foreground/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm">¿No ves las notificaciones en iPhone?</AlertTitle>
            <AlertDescription className="text-xs space-y-2 mt-2">
              <p>Verifica estos puntos:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Abre <strong>Ajustes → Notificaciones → Clarita</strong> y activa "Permitir notificaciones"</li>
                <li>Si usas <strong>Modo Enfoque</strong> (Focus), verifica que Clarita esté permitido</li>
                <li>Asegúrate de abrir la app desde el <strong>ícono en pantalla de inicio</strong> (no Safari)</li>
                <li>Si sigue sin funcionar, usa el botón <strong>Resetear</strong> y luego <strong>Probar</strong></li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Android Troubleshooting Checklist */}
        {hasSubscription && platform === 'android' && (
          <Alert className="bg-muted/50 border-muted-foreground/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm">¿No ves las notificaciones en Android?</AlertTitle>
            <AlertDescription className="text-xs space-y-2 mt-2">
              <p>Verifica estos puntos:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Abre <strong>Ajustes → Apps → Chrome → Notificaciones</strong> y asegúrate que estén activadas</li>
                <li>Verifica que el <strong>Modo No Molestar</strong> esté desactivado</li>
                <li>Si sigue sin funcionar, usa el botón <strong>Resetear</strong> y luego <strong>Probar</strong></li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
        </div>

        {/* Devices */}
        {subscriptions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Dispositivos registrados
              </h4>
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(sub.device_name)}
                    <div>
                      <p className="font-medium text-sm">{sub.device_name || "Dispositivo"}</p>
                      <p className="text-xs text-muted-foreground">
                        Registrado: {new Date(sub.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onUnsubscribe(sub.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Settings */}
        {hasSubscription && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Configuración de notificaciones
              </h4>

              {/* Morning budget check */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Resumen matutino de presupuesto</Label>
                  <p className="text-xs text-muted-foreground">
                    Recibe un resumen de tus presupuestos cada mañana
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={settings.morning_time}
                    onValueChange={(v) => onUpdateSettings({ morning_time: v })}
                    disabled={!settings.morning_budget_check}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Switch
                    checked={settings.morning_budget_check}
                    onCheckedChange={(v) => onUpdateSettings({ morning_budget_check: v })}
                  />
                </div>
              </div>

              {/* Evening expense reminder */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Recordatorio nocturno de gastos</Label>
                  <p className="text-xs text-muted-foreground">
                    Recordatorio para registrar tus gastos del día
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={settings.evening_time}
                    onValueChange={(v) => onUpdateSettings({ evening_time: v })}
                    disabled={!settings.evening_expense_reminder}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Switch
                    checked={settings.evening_expense_reminder}
                    onCheckedChange={(v) => onUpdateSettings({ evening_expense_reminder: v })}
                  />
                </div>
              </div>

              {/* Budget exceeded alert */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alerta de presupuesto excedido</Label>
                  <p className="text-xs text-muted-foreground">
                    Notificación inmediata cuando superes un presupuesto
                  </p>
                </div>
                <Switch
                  checked={settings.budget_exceeded_alert}
                  onCheckedChange={(v) => onUpdateSettings({ budget_exceeded_alert: v })}
                />
              </div>

              {/* Monthly recurring reminder */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Recordatorio mensual de gastos recurrentes</Label>
                  <p className="text-xs text-muted-foreground">
                    Recordatorio para cargar tus gastos recurrentes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(settings.monthly_reminder_day)}
                    onValueChange={(v) => onUpdateSettings({ monthly_reminder_day: parseInt(v) })}
                    disabled={!settings.monthly_recurring_reminder}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Switch
                    checked={settings.monthly_recurring_reminder}
                    onCheckedChange={(v) => onUpdateSettings({ monthly_recurring_reminder: v })}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
