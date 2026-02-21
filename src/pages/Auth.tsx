import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, PiggyBank, BarChart3, Check, Loader2 } from "lucide-react";
import ForgotPasswordDialog from "@/components/auth/ForgotPasswordDialog";
import { RuculaLogo } from "@/components/RuculaLogo";

import { toast } from "sonner";
import { getLastUser, setLastUser } from "@/lib/authStorage";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") ? decodeURIComponent(searchParams.get("redirect")!) : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const lastUser = getLastUser();
  const showReturningUser = !isSignUp && lastUser && !showFullForm;

  const { session } = useAuth();
  useEffect(() => {
    if (session) {
      navigate(redirectTo, { replace: true });
    }
  }, [session, navigate, redirectTo]);

  const saveLastUserAndRedirect = (userEmail: string, userName: string) => {
    setLastUser({ email: userEmail, full_name: userName });
    navigate(redirectTo, { replace: true });
  };

  const getAuthErrorMessage = (error: { code?: string; message?: string; weak_password?: { reasons?: string[] } }) => {
    if (error.code === "weak_password") {
      const reasons = error.weak_password?.reasons || [];
      if (reasons.includes("pwned")) {
        return "Esta contraseña fue expuesta en filtraciones de datos. Elegí una contraseña más segura y única.";
      }
      return "La contraseña es muy débil o fácil de adivinar. Usá al menos 8 caracteres, números y símbolos.";
    }
    if (error.message?.includes("already registered")) {
      return "Este email ya está registrado. Iniciá sesión.";
    }
    return error.message || "Ocurrió un error. Intentá de nuevo.";
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) {
        const msg = getAuthErrorMessage(error);
        setPasswordError(error.code === "weak_password" ? msg : null);
        toast.error(msg);
        return;
      }
      if (data.session) {
        saveLastUserAndRedirect(email, fullName || email.split("@")[0]);
      } else {
        toast.success("¡Cuenta creada! Revisá tu email para confirmar.");
        navigate(redirectTo);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const signInEmail = showReturningUser ? lastUser!.email : email;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password,
      });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email o contraseña incorrectos");
        } else {
          toast.error(error.message);
        }
        return;
      }
      if (!data.session) return;
      const userName =
        data.user.user_metadata?.full_name ||
        data.user.email?.split("@")[0] ||
        "Usuario";
      saveLastUserAndRedirect(data.user.email!, userName);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, text: "Controlá tus ingresos y gastos" },
    { icon: PiggyBank, text: "Gestioná tus ahorros en ARS y USD" },
    { icon: BarChart3, text: "Visualizá tendencias y presupuestos" },
  ];

  const renderForm = () => {
    if (showReturningUser) {
      return (
        <form onSubmit={handleSignIn} className="space-y-5" autoComplete="off">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Hola, {lastUser!.full_name || lastUser!.email.split("@")[0]}!
            </h2>
            <p className="text-sm text-muted-foreground">
              Ingresá tu contraseña para continuar
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="off"
              className="h-12 bg-background border-border focus:border-primary focus:ring-primary/20"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 gradient-primary hover:opacity-90 text-base font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setForgotPasswordOpen(true)}
              className="text-sm text-primary font-medium hover:underline focus:outline-none focus:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                setShowFullForm(true);
                setPassword("");
              }}
            >
              Iniciar con otra cuenta
            </Button>
          </div>
          <Link
            to="/privacy"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors block text-center mt-4"
          >
            Política de privacidad
          </Link>
        </form>
      );
    }

    return (
      <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5" autoComplete="off">
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Juan Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-12 bg-background border-border focus:border-primary focus:ring-primary/20"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            className="h-12 bg-background border-border focus:border-primary focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            required
            minLength={6}
            autoComplete="off"
            className={`h-12 bg-background border-border focus:border-primary focus:ring-primary/20 ${
              passwordError ? "border-destructive focus:border-destructive" : ""
            }`}
          />
          {passwordError && (
            <p className="text-sm text-destructive font-medium" role="alert">
              {passwordError}
            </p>
          )}
          {isSignUp && !passwordError && (
            <p className="text-xs text-muted-foreground">
              Mínimo 6 caracteres. Evitá contraseñas comunes o usadas en otras cuentas.
            </p>
          )}
          {!isSignUp && (
            <button
              type="button"
              onClick={() => setForgotPasswordOpen(true)}
              className="text-sm text-primary font-medium hover:underline focus:outline-none focus:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </div>
        <Button
          type="submit"
          className="w-full h-12 gradient-primary hover:opacity-90 text-base font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isSignUp ? "Creando cuenta..." : "Iniciando sesión..."}
            </>
          ) : isSignUp ? (
            "Crear cuenta"
          ) : (
            "Iniciar sesión"
          )}
        </Button>

      </form>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 stripe-gradient-bg" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary-glow/20" />
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-foreground">
          <div className="flex items-center justify-center gap-3 mb-12">
            <RuculaLogo size="xl" />
          </div>
          <h2 className="text-2xl font-medium mb-8 leading-relaxed text-foreground/80">
            Tomá el control de tus finanzas
            <br />
            personales de forma simple
          </h2>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-card/80 backdrop-blur-sm shadow-stripe border border-border">
                <div className="p-2 rounded-xl bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg text-foreground">{feature.text}</span>
              </div>
            ))}
          </div>
          <div className="absolute bottom-8 left-12 right-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" />
              <span>Gratis • Seguro • Sin publicidad</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 pb-[max(2rem,env(safe-area-inset-bottom,0px))] lg:pb-12 bg-background">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <RuculaLogo size="lg" />
          </div>

          {!showReturningUser && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
              </h2>
              <p className="text-muted-foreground">
                {isSignUp ? "Completá tus datos para empezar" : "Ingresá tus credenciales para continuar"}
              </p>
            </div>
          )}

          {renderForm()}

          {!showReturningUser && (
            <div className="mt-8 text-center space-y-4">
              <p className="text-muted-foreground">
                {isSignUp ? "¿Ya tenés cuenta?" : "¿No tenés cuenta?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setEmail("");
                    setPassword("");
                    setFullName("");
                    setPasswordError(null);
                  }}
                  className="text-primary font-medium hover:underline focus:outline-none focus:underline"
                >
                  {isSignUp ? "Iniciá sesión" : "Registrate"}
                </button>
              </p>
              <Link
                to="/privacy"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors block"
              >
                Política de privacidad
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
        defaultEmail={showReturningUser ? lastUser?.email : email}
      />
    </div>
  );
};

export default Auth;
