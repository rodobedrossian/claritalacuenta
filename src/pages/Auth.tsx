import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, TrendingUp, PiggyBank, BarChart3, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  isBiometricAvailable,
  storeSession,
  setBiometricEnabled,
} from "@/lib/biometricAuth";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/", { replace: true });
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este email ya está registrado. Iniciá sesión.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success("¡Cuenta creada! Redirigiendo...");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
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
      if (useBiometric && data.session) {
        try {
          await storeSession(data.session);
          setBiometricEnabled(true);
        } catch (err) {
          console.warn("[Auth] storeSession:", err);
          toast.error("No se pudo activar Face ID. Podés hacerlo después en Configuración.");
        }
      }
      toast.success("¡Bienvenido!");
      navigate("/");
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding with Stripe-style gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Stripe-style Gradient Background */}
        <div className="absolute inset-0 stripe-gradient-bg" />
        
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary-glow/20" />

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-foreground">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="p-3 rounded-2xl gradient-primary shadow-stripe-lg">
              <Wallet className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold">Clarita la cuenta</h1>
          </div>

          {/* Tagline */}
          <h2 className="text-2xl font-medium mb-8 leading-relaxed text-foreground/80">
            Tomá el control de tus finanzas
            <br />
            personales de forma simple
          </h2>

          {/* Features */}
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

          {/* Bottom decoration */}
          <div className="absolute bottom-8 left-12 right-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" />
              <span>Gratis • Seguro • Sin publicidad</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="p-2 rounded-xl gradient-primary shadow-stripe">
              <Wallet className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Clarita la cuenta</h1>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">{isSignUp ? "Crear cuenta" : "Iniciar sesión"}</h2>
            <p className="text-muted-foreground">
              {isSignUp ? "Completá tus datos para empezar" : "Ingresá tus credenciales para continuar"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Nombre completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-12 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
              />
              {isSignUp && <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>}
            </div>

            {!isSignUp && biometricAvailable && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="useBiometric"
                  checked={useBiometric}
                  onCheckedChange={(v) => setUseBiometric(v === true)}
                />
                <Label
                  htmlFor="useBiometric"
                  className="text-sm text-muted-foreground font-normal cursor-pointer"
                >
                  Desbloquear con Face ID o código del teléfono la próxima vez
                </Label>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 gradient-primary hover:opacity-90 text-base font-medium transition-opacity shadow-stripe"
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

          {/* Toggle */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              {isSignUp ? "¿Ya tenés cuenta?" : "¿No tenés cuenta?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail("");
                  setPassword("");
                  setFullName("");
                }}
                className="text-primary font-medium hover:underline focus:outline-none focus:underline"
              >
                {isSignUp ? "Iniciá sesión" : "Registrate"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
