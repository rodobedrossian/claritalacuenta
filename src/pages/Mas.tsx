import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Target, Sparkles, Settings, LogOut, Tag, Repeat, PiggyBank, ChevronDown, Info, UserPlus, Users, UserMinus } from "lucide-react";
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
import { useWorkspace } from "@/hooks/useWorkspace";
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
  const [members, setMembers] = useState<Array<{ user_id: string; role: string; full_name: string | null }>>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ user_id: string; full_name: string | null } | null>(null);
  const [removing, setRemoving] = useState(false);

  const { workspaceId } = useWorkspace(user?.id ?? null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!workspaceId || !user?.id) {
      setMembers([]);
      return;
    }
    let mounted = true;
    setMembersLoading(true);
    (async () => {
      const { data: rows, error: err } = await supabase
        .from("workspace_members")
        .select("user_id, role")
        .eq("workspace_id", workspaceId);
      if (err || !mounted) {
        if (mounted) setMembers([]);
        setMembersLoading(false);
        return;
      }
      if (!rows?.length) {
        setMembers([]);
        setMembersLoading(false);
        return;
      }
      const userIds = rows.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const nameByUserId = new Map((profiles || []).map((p) => [p.id, p.full_name]));
      if (!mounted) return;
      setMembers(
        rows.map((r) => ({
          user_id: r.user_id,
          role: r.role,
          full_name: nameByUserId.get(r.user_id) ?? null,
        }))
      );
      setMembersLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [workspaceId, user?.id]);

  const myRole = members.find((m) => m.user_id === user?.id)?.role ?? null;
  const isOwner = myRole === "owner";

  const handleRemoveMember = async () => {
    if (!removeTarget || !workspaceId) return;
    setRemoving(true);
    try {
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("user_id", removeTarget.user_id);
      if (error) throw error;
      setMembers((prev) => prev.filter((m) => m.user_id !== removeTarget.user_id));
      setRemoveTarget(null);
      toast.success("Miembro eliminado del espacio");
    } catch (err: any) {
      toast.error(err.message || "No se pudo eliminar");
    } finally {
      setRemoving(false);
    }
  };

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

          {/* Miembros del espacio */}
          <div className="mb-6">
            <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Miembros del espacio</span>
            </div>
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
              {membersLoading ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">Cargando…</div>
              ) : members.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">Solo vos en este espacio</div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {members.map((m) => {
                    const isSelf = m.user_id === user?.id;
                    const ownersCount = members.filter((x) => x.role === "owner").length;
                    const canRemoveOther = isOwner && !isSelf;
                    const canLeave = isSelf && (myRole !== "owner" || ownersCount > 1);
                    const canRemove = canRemoveOther || canLeave;
                    const label = m.full_name?.trim() || "Sin nombre";
                    return (
                      <li
                        key={m.user_id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
                              "bg-muted text-muted-foreground"
                            )}
                          >
                            {label.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {label}
                              {isSelf && (
                                <span className="text-muted-foreground font-normal ml-1">(vos)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                          </div>
                        </div>
                        {canRemove && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                            onClick={() => setRemoveTarget({ user_id: m.user_id, full_name: m.full_name })}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            {isSelf ? "Dejar espacio" : "Eliminar"}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

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

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removeTarget?.user_id === user?.id ? "Dejar el espacio" : "Eliminar miembro"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.user_id === user?.id
                ? "Vas a dejar de ver y editar este espacio compartido. Podés ser invitado de nuevo después."
                : `¿Quitar a ${removeTarget?.full_name?.trim() || "este miembro"} del espacio? Dejará de ver y editar todo el espacio.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemoveMember();
              }}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? "Eliminando…" : removeTarget?.user_id === user?.id ? "Dejar espacio" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
