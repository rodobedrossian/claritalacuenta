import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useInviteDrawer } from "@/contexts/InviteDrawerContext";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Users, Clock, UserMinus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

export function InviteToWorkspaceDrawer() {
  const { open, setOpen } = useInviteDrawer();
  const { user } = useAuth();
  const { workspaceId } = useWorkspace(user?.id ?? null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [members, setMembers] = useState<Array<{ user_id: string; role: string; full_name: string | null }>>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<Array<{ id: string; email: string; created_at: string }>>([]);
  const [pendingInvitationsLoading, setPendingInvitationsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [removeTarget, setRemoveTarget] = useState<{ user_id: string; full_name: string | null } | null>(null);
  const [removing, setRemoving] = useState(false);

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
    return () => { mounted = false; };
  }, [workspaceId, user?.id]);

  useEffect(() => {
    if (!workspaceId || !user?.id) {
      setPendingInvitations([]);
      return;
    }
    let mounted = true;
    setPendingInvitationsLoading(true);
    (async () => {
      const { data: rows, error } = await supabase
        .from("workspace_invitations")
        .select("id, email, created_at")
        .eq("workspace_id", workspaceId)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString());
      if (!mounted) return;
      if (error) {
        setPendingInvitations([]);
      } else {
        setPendingInvitations(rows ?? []);
      }
      setPendingInvitationsLoading(false);
    })();
    return () => { mounted = false; };
  }, [workspaceId, user?.id, refreshKey]);

  const myRole = members.find((m) => m.user_id === user?.id)?.role ?? null;
  const isOwner = myRole === "owner";

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
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      console.error("Send invite:", err);
      toast.error(err instanceof Error ? err.message : "No se pudo enviar la invitación");
    } finally {
      setInviteSending(false);
    }
  };

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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? (err as Error).message : "No se pudo eliminar");
    } finally {
      setRemoving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent
          className={cn(
            "fixed inset-0 z-50 mt-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-none border-0",
            "[&>:first-child]:hidden"
          )}
        >
          <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
            <DrawerHeader className="shrink-0 border-b border-border px-4 py-3 text-left sm:text-left">
              <div className="flex items-center justify-between gap-4 pr-10">
                <DrawerTitle className="text-lg font-semibold">Invitar al espacio</DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="absolute right-3 top-3 h-9 w-9 rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-8">
              <p className="text-sm text-muted-foreground">
                La persona va a recibir un mail con un enlace. Al aceptar, va a poder ver y agregar gastos, tarjetas y más en el mismo espacio.
              </p>

              {/* Formulario invitar */}
              <form onSubmit={handleSendInvite} className="space-y-3">
                <Label htmlFor="invite-email-drawer">Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-email-drawer"
                    type="email"
                    placeholder="ejemplo@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={inviteSending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={inviteSending}>
                    {inviteSending ? "Enviando…" : "Enviar"}
                  </Button>
                </div>
              </form>

              {/* Invitaciones pendientes */}
              {(pendingInvitations.length > 0 || pendingInvitationsLoading) && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Invitaciones pendientes</span>
                  </div>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {pendingInvitationsLoading ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">Cargando…</div>
                    ) : pendingInvitations.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">No hay invitaciones pendientes</div>
                    ) : (
                      <ul className="divide-y divide-border">
                        {pendingInvitations.map((inv) => (
                          <li key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3">
                            <span className="text-sm font-medium truncate">{inv.email}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(inv.created_at).toLocaleDateString("es-AR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Miembros del espacio */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Miembros del espacio</span>
                </div>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  {membersLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">Cargando…</div>
                  ) : members.length === 0 && pendingInvitations.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">Solo vos en este espacio</div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {members.map((m) => {
                        const isSelf = m.user_id === user?.id;
                        const ownersCount = members.filter((x) => x.role === "owner").length;
                        const canRemoveOther = isOwner && !isSelf;
                        const canLeave = isSelf && (myRole !== "owner" || ownersCount > 1);
                        const canRemove = canRemoveOther || canLeave;
                        const label = m.full_name?.trim() || "Sin nombre";
                        return (
                          <li key={m.user_id} className="flex items-center justify-between gap-3 px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={cn(
                                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 bg-muted text-muted-foreground"
                                )}
                              >
                                {label.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {label}
                                  {isSelf && <span className="text-muted-foreground font-normal ml-1">(vos)</span>}
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
            </div>
          </div>
        </DrawerContent>
      </Drawer>

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
    </>
  );
}
