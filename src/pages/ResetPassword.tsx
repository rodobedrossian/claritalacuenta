import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const getWeakPasswordMessage = (error: { code?: string; weak_password?: { reasons?: string[] } }) => {
  if (error.code === "weak_password" && error.weak_password?.reasons?.includes("pwned")) {
    return "Esta contraseña fue expuesta en filtraciones de datos. Elegí una contraseña más segura y única.";
  }
  return "La contraseña es muy débil o fácil de adivinar. Usá al menos 8 caracteres, números y símbolos.";
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { session } = useAuth();

  // Initial session from context (e.g. already logged in or token exchanged)
  useEffect(() => {
    if (session) {
      setIsValidSession(true);
    }
  }, [session]);

  // Recovery flow: listen for PASSWORD_RECOVERY / SIGNED_IN and timeout
  useEffect(() => {
    let resolved = false;
    let timeoutId: NodeJS.Timeout;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && s)) {
        resolved = true;
        clearTimeout(timeoutId);
        setIsValidSession(true);
      }
    });

    timeoutId = setTimeout(() => {
      if (!resolved) {
        setIsValidSession(false);
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        if (error.code === "weak_password") {
          const msg = getWeakPasswordMessage(error);
          setPasswordError(msg);
          toast.error(msg);
        } else if (error.message.includes("same as")) {
          toast.error("La nueva contraseña debe ser diferente a la anterior");
        } else {
          toast.error(error.message);
        }
        return;
      }

      setSuccess(true);
      toast.success("¡Contraseña actualizada correctamente!");

      // Sign out and redirect to login after a moment
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/auth", { replace: true });
      }, 2000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  if (isValidSession === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-2xl gradient-primary shadow-stripe-lg">
              <img src="/rucula-logo.png" alt="Rucula" className="h-10 w-10 object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Enlace inválido o expirado</h1>
          <p className="text-muted-foreground mb-6">
            El enlace de recuperación ha expirado o ya fue utilizado. Por favor, solicitá uno nuevo.
          </p>
          <Button onClick={() => navigate("/auth")} className="gradient-primary">
            Volver al inicio de sesión
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-2xl bg-success/20">
              <Check className="h-10 w-10 text-success" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">¡Contraseña actualizada!</h1>
          <p className="text-muted-foreground">
            Redirigiendo al inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2 rounded-xl gradient-primary shadow-stripe">
            <img src="/rucula-logo.png" alt="Rucula" className="h-8 w-8 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Rucula</h1>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Nueva contraseña</h2>
          <p className="text-muted-foreground">
            Ingresá tu nueva contraseña para recuperar el acceso a tu cuenta
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                required
                minLength={6}
                className={`h-12 bg-background border-border focus:border-primary focus:ring-primary/20 pr-12 ${
                  passwordError ? "border-destructive focus:border-destructive" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-sm text-destructive font-medium" role="alert">
                {passwordError}
              </p>
            )}
            {!passwordError && <p className="text-xs text-muted-foreground">Mínimo 6 caracteres. Evitá contraseñas comunes o usadas en otras cuentas.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-background border-border focus:border-primary focus:ring-primary/20 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 gradient-primary hover:opacity-90 text-base font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Actualizar contraseña"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="text-primary font-medium hover:underline focus:outline-none focus:underline"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
