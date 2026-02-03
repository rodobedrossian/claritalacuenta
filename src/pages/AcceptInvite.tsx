import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface InvitationRow {
  id: string;
  workspace_id: string;
  email: string;
  invited_by_user_id: string;
  status: string;
  expires_at: string;
  inviter_email: string | null;
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<InvitationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      const { data: invData, error } = await supabase.rpc("get_workspace_invitation_by_token", {
        in_token: token,
      });

      if (!mounted) return;
      if (error || !invData?.length) {
        setInvalid(true);
        setLoading(false);
        return;
      }

      const row = invData[0] as InvitationRow;
      const expired = new Date(row.expires_at) <= new Date();
      if (row.status !== "pending" || expired) {
        setInvalid(true);
        setLoading(false);
        return;
      }

      setInvitation(row);

      const { data: { user: u } } = await supabase.auth.getUser();
      if (mounted) setUser(u ?? null);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !user) return;
    const displayName = name.trim() || user.email?.split("@")[0] || "Usuario";

    setSubmitting(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: displayName })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const { error: memberError } = await supabase.from("workspace_members").insert({
        workspace_id: invitation.workspace_id,
        user_id: user.id,
        role: "member",
      });

      if (memberError) {
        if (memberError.code === "23505") {
          toast.info("Ya formás parte de este espacio");
        } else throw memberError;
      }

      const { error: invError } = await supabase
        .from("workspace_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      if (invError) throw invError;

      toast.success("¡Listo! Ya podés ver y editar todo en el espacio compartido.");
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Accept invite:", err);
      toast.error(err.message || "No se pudo aceptar la invitación");
    } finally {
      setSubmitting(false);
    }
  };

  const redirectToAuth = () => {
    const redirect = `/accept-invite?token=${encodeURIComponent(token ?? "")}`;
    navigate(`/auth?redirect=${encodeURIComponent(redirect)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando invitación...</p>
        </div>
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Link inválido o expirado</h1>
          <p className="text-muted-foreground text-sm">
            La invitación ya no está disponible. Pedile a quien te invitó que te envíe una nueva.
          </p>
          <Button onClick={() => navigate("/auth")} className="w-full">
            Ir a iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm space-y-6">
          <div className="flex justify-center">
            <img src="/rucula-logo.png" alt="Rucula" className="h-12 w-12 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Te invitaron a Rucula</h1>
          <p className="text-muted-foreground text-sm">
            {invitation?.inviter_email
              ? `${invitation.inviter_email} te invitó a compartir su espacio. Iniciá sesión o creá una cuenta para aceptar.`
              : "Alguien te invitó a compartir su espacio. Iniciá sesión o creá una cuenta para aceptar."}
          </p>
          <Button onClick={redirectToAuth} className="w-full" size="lg">
            Iniciar sesión o crear cuenta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <img src="/rucula-logo.png" alt="Rucula" className="h-12 w-12 object-contain" />
        </div>
        <h1 className="text-xl font-semibold text-foreground text-center">
          ¿Cuál es tu nombre?
        </h1>
        <p className="text-muted-foreground text-sm text-center">
          Así te van a ver en el espacio compartido.
        </p>
        <form onSubmit={handleAccept} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                Aceptar invitación
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
