import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Target, Sparkles, Settings, LogOut, Tag, Repeat, PiggyBank, ChevronDown, Info, UserPlus } from "lucide-react";
import { performLogout } from "@/lib/biometricAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

const APP_VERSION = "1.0.0";

function getInitials(name: string | undefined, email: string | undefined): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}

const menuItems = [
  { title: "Ahorros", path: "/savings", icon: PiggyBank },
  { title: "Presupuestos", path: "/budgets", icon: Target },
  { title: "Recurrentes", path: "/recurrentes", icon: Repeat },
  { title: "Insights", path: "/insights", icon: Sparkles },
  { title: "Categorías", path: "/categories", icon: Tag },
  { title: "Configuración", path: "/settings", icon: Settings },
];

export default function Mas() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const handleSignOut = async () => {
    await performLogout();
    navigate("/auth");
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";
  const initials = getInitials(user?.user_metadata?.full_name, user?.email);

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
      toast.error(err.message || "No se pudo enviar la invitación");
    } finally {
      setInviteSending(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col min-h-0 md:max-w-2xl md:mx-auto md:w-full">
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-6">
          {/* Profile header - respeta Dynamic Island */}
          <div className="flex flex-col items-center text-center mb-8">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold",
                "bg-primary/10 text-primary border-2 border-primary/20"
              )}
            >
              {initials}
            </div>
            <h1 className="text-2xl font-bold text-foreground mt-4 leading-tight">
              {displayName}
            </h1>
            {user?.email && (
              <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            )}
          </div>

          {/* Menu items */}
          <div className="space-y-1 mb-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-colors bg-card border border-border/50 hover:bg-muted/50 active:opacity-90"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
                    <span className="font-medium text-foreground">{item.title}</span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
                </button>
              );
            })}
          </div>

          {/* Invitar - abre diálogo para invitar a alguien al espacio */}
          <button
            onClick={() => setInviteOpen(true)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-colors bg-card border border-border/50 hover:bg-muted/50 active:opacity-90"
          >
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-primary" strokeWidth={2} />
              <span className="font-medium text-foreground">Invitar</span>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
          </button>

          {/* Legales - navega a pantalla dedicada */}
          <button
            onClick={() => navigate("/legales")}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-colors bg-card border border-border/50 hover:bg-muted/50 active:opacity-90"
          >
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-primary" strokeWidth={2} />
              <span className="font-medium text-foreground">Legales</span>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
          </button>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl mt-6 text-destructive hover:bg-destructive/10 active:opacity-90 transition-colors"
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
            <span className="font-medium">Cerrar sesión</span>
          </button>

          {/* Version - al final del scroll */}
          <p className="text-center text-xs text-muted-foreground py-6 mt-2">
            versión {APP_VERSION}
          </p>
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitar al espacio</DialogTitle>
            <DialogDescription>
              La persona va a recibir un mail con un enlace. Al aceptar, va a poder ver y agregar gastos, tarjetas y más en el mismo espacio.
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
                {inviteSending ? "Enviando…" : "Enviar invitación"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
