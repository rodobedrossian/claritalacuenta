import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { RuculaLogo } from "@/components/RuculaLogo";

interface InvitationRow {
  id: string;
  workspace_id: string;
  email: string;
  invited_by_user_id: string;
  status: string;
  expires_at: string;
  inviter_email: string | null;
  has_account?: boolean;
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const { user } = useAuth();
  const [invitation, setInvitation] = useState<InvitationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      const { data: invData, error } = await supabase.rpc("get_workspace_invitation_by_token" as any, {
        in_token: token,
      });

      if (!mounted) return;
      if (error || !invData || invData.length === 0) {
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
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  const completeAccept = async (userId: string, displayName: string) => {
    if (!invitation) return;
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: displayName })
      .eq("id", userId);

    if (profileError) throw profileError;

    const { error: memberError } = await supabase.from("workspace_members").insert({
      workspace_id: invitation.workspace_id,
      user_id: userId,
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
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !user) return;
    const displayName = name.trim() || user.email?.split("@")[0] || "Usuario";

    setSubmitting(true);
    setAuthError(null);
    try {
      await completeAccept(user.id, displayName);
    } catch (err: any) {
      console.error("Accept invite:", err);
      toast.error(err.message || "No se pudo aceptar la invitación");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    const displayName = name.trim() || invitation.email?.split("@")[0] || "Usuario";
    const pwd = password.trim();
    if (!pwd || pwd.length < 6) {
      setAuthError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSubmitting(true);
    setAuthError(null);
    try {
      const hasAccount = invitation.has_account ?? false;

      if (hasAccount) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: invitation.email,
          password: pwd,
        });
        if (error) {
          if (error.message.includes("Invalid login") || error.message.includes("incorrect")) {
            setAuthError("Contraseña incorrecta");
          } else {
            setAuthError(error.message);
          }
          return;
        }
        if (data.user) {
          await completeAccept(data.user.id, displayName);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: invitation.email,
          password: pwd,
          options: { data: { full_name: displayName } },
        });
        if (error) {
          if (error.message.includes("already registered") || error.message.includes("already been registered")) {
            setAuthError("Ese email ya está registrado. Usá tu contraseña para ingresar.");
          } else {
            setAuthError(error.message);
          }
          return;
        }
        if (data.user) {
          if (data.session) {
            await completeAccept(data.user.id, displayName);
          } else {
            toast.success("Revisá tu email para confirmar la cuenta. Después volvé a este link para ingresar.");
          }
        }
      }
    } catch (err: any) {
      console.error("Unified submit:", err);
      setAuthError(err.message || "No se pudo completar");
    } finally {
      setSubmitting(false);
    }
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

  if (!user && invitation) {
    const hasAccount = invitation.has_account ?? false;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex justify-center">
            <RuculaLogo size="lg" />
          </div>
          <h1 className="text-xl font-semibold text-foreground text-center">
            Unite a Rucula
          </h1>
          <p className="text-muted-foreground text-sm text-center">
            {invitation.inviter_email
              ? `${invitation.inviter_email} te invitó a compartir su espacio.`
              : "Alguien te invitó a compartir su espacio."}
          </p>
          <p className="text-sm text-foreground font-medium text-center">
            Vas a ingresar con <strong>{invitation.email}</strong>
          </p>
          <form onSubmit={handleUnifiedSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unified-name">Nombre</Label>
              <Input
                id="unified-name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unified-password">Contraseña</Label>
              <Input
                id="unified-password"
                type="password"
                placeholder={hasAccount ? "Tu contraseña" : "Creá una contraseña (mín. 6 caracteres)"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>
            {authError && (
              <p className="text-sm text-destructive">{authError}</p>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : hasAccount ? (
                "Ingresar"
              ) : (
                "Crear cuenta e ingresar"
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <RuculaLogo size="lg" />
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
