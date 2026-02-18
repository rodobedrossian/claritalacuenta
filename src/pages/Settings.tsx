import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SettingsSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { Bell, Fingerprint, User, Trash2, Loader2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  isBiometricSupported,
  isBiometricEnabled,
  setBiometricEnabled,
  storeSession,
  clearStoredSession,
} from "@/lib/biometricAuth";
import { showIOSBanner } from "@/hooks/use-ios-banner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { performLogout } from "@/lib/biometricAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, session, loading: authLoading } = useAuth();
  const [biometricOn, setBiometricOn] = useState(false);
  const [biometricToggling, setBiometricToggling] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const showBiometric = isBiometricSupported();

  useEffect(() => {
    if (showBiometric) setBiometricOn(isBiometricEnabled());
  }, [showBiometric]);

  const pushNotifications = usePushNotifications(user?.id ?? null);

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await performLogout();
      navigate("/auth", { replace: true });
      if (!isMobile) toast.success("Cuenta eliminada correctamente");
    } catch (e) {
      console.error("Delete account error:", e);
      const msg = e instanceof Error ? e.message : "No se pudo eliminar la cuenta";
      if (isMobile) {
        showIOSBanner(msg, "error");
      } else {
        toast.error(msg);
      }
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Ingresá un email válido");
      return;
    }
    setInviteSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-workspace-invite", {
        body: { email },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Invitación enviada. Le va a llegar un mail para unirse al espacio.");
      setInviteEmail("");
      setInviteOpen(false);
    } catch (err: any) {
      console.error("Send invite:", err);
      toast.error(err?.message || "No se pudo enviar la invitación");
    } finally {
      setInviteSending(false);
    }
  };

  if (authLoading || pushNotifications.loading) {
    return (
      <AppLayout>
        <SettingsSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 pt-safe pb-3 transition-all duration-300">
          <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
            <div className="h-10 flex items-center">
              <h1 className="text-xl font-bold tracking-tight">Configuración</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          {showBiometric && (
            <Card className="mb-6 gradient-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Fingerprint className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Desbloquear con Face ID o código</CardTitle>
                      <CardDescription>
                        La próxima vez que abras la app, usá Face ID o el código del teléfono en lugar de la contraseña.
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={biometricOn}
                    disabled={biometricToggling}
                    onCheckedChange={async (checked) => {
                      setBiometricToggling(true);
                      try {
                        if (checked) {
                          if (!session) {
                            showIOSBanner("Tenés que estar conectado para activar Face ID.", "error");
                            return;
                          }
                          await storeSession(session);
                          setBiometricEnabled(true);
                          setBiometricOn(true);
                          showIOSBanner("Face ID o código activado", "success");
                        } else {
                          await clearStoredSession();
                          setBiometricEnabled(false);
                          setBiometricOn(false);
                          showIOSBanner("Face ID o código desactivado", "success");
                        }
                      } catch (e) {
                        console.warn("[Settings] biometric toggle:", e);
                        showIOSBanner("No se pudo activar. ¿Tenés Face ID o código configurado?", "error");
                      } finally {
                        setBiometricToggling(false);
                      }
                    }}
                  />
                </div>
              </CardHeader>
            </Card>
          )}

          <Tabs defaultValue="account" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="account" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Cuenta</span>
                <span className="sm:hidden text-xs">Cuenta</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notificaciones</span>
                <span className="sm:hidden text-xs">Alertas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mis datos</CardTitle>
                  <CardDescription>
                    Información de tu cuenta (solo lectura)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-base font-medium">{user?.email || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                    <p className="text-base font-medium">
                      {user?.user_metadata?.full_name || "No especificado"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {!isMobile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" />
                      Invitar al espacio
                    </CardTitle>
                    <CardDescription>
                      Enviá una invitación por email para que otra persona se sume a tu workspace y pueda ver y editar junto con vos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setInviteOpen(true)} variant="secondary" className="w-full sm:w-auto">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Enviar invitación
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-lg text-destructive flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Eliminar cuenta
                  </CardTitle>
                  <CardDescription>
                    Se eliminarán todos tus datos de forma permanente. Esta acción no se puede deshacer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    Eliminar mi cuenta
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationSettings
                isSupported={pushNotifications.isSupported}
                isPWA={pushNotifications.isPWA}
                platform={pushNotifications.platform}
                permission={pushNotifications.permission}
                subscriptions={pushNotifications.subscriptions}
                settings={pushNotifications.settings}
                loading={pushNotifications.loading}
                subscribing={pushNotifications.subscribing}
                onSubscribe={pushNotifications.subscribe}
                onUnsubscribe={pushNotifications.unsubscribe}
                onResetSubscription={pushNotifications.resetSubscription}
                onUpdateSettings={pushNotifications.updateSettings}
                onSendTest={pushNotifications.sendTestNotification}
              />
            </TabsContent>
          </Tabs>
        </main>

        <div className="h-[calc(72px+env(safe-area-inset-bottom,0)+2rem)] md:hidden" />
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitar al espacio</DialogTitle>
            <DialogDescription>
              Ingresá el email de la persona que querés invitar. Le va a llegar un correo con el link para unirse a tu workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="ejemplo@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={inviteSending}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)} disabled={inviteSending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={inviteSending}>
                {inviteSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  "Enviar invitación"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán permanentemente tus datos: transacciones, ahorros, tarjetas, presupuestos y configuraciones.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar cuenta"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
