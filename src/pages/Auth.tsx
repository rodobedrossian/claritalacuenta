import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, TrendingUp, PiggyBank, BarChart3, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import {
  isBiometricAvailable,
  isBiometricSupported,
  isBiometricEnabled,
  hasStoredCredentials,
  getStoredSession,
  storeSession,
  setBiometricEnabled,
  hasBiometricPromptBeenShown,
  setBiometricPromptShown,
} from "@/lib/biometricAuth";
import { getLastUser, setLastUser } from "@/lib/authStorage";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

const Auth = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);
  const [pendingSession, setPendingSession] = useState<Session | null>(null);

  const lastUser = getLastUser();
  const showReturningUser = !isSignUp && lastUser && !showFullForm;
  const [checkingBiometric, setCheckingBiometric] = useState(true);

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/", { replace: true });
      }
    });
  }, [navigate]);

  // When showing returning user, try Face ID first if biometric is configured
  useEffect(() => {
    if (!showReturningUser) {
      setCheckingBiometric(false);
      return;
    }
    let mounted = true;
    (async () => {
      const supported = isBiometricSupported();
      const enabled = isBiometricEnabled();
      if (!supported || !enabled) {
        if (mounted) setCheckingBiometric(false);
        return;
      }
      const stored = await hasStoredCredentials();
      if (!mounted) return;
      if (!stored) {
        setCheckingBiometric(false);
        return;
      }
      try {
        const session = await getStoredSession();
        if (!mounted) return;
        if (session) {
          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          navigate("/", { replace: true });
          return;
        }
      } catch {
        // User cancelled or failed - show password form
      }
      if (mounted) setCheckingBiometric(false);
    })();
    return () => { mounted = false; };
  }, [showReturningUser, navigate]);

  const saveLastUserAndMaybeShowBiometric = (
    userEmail: string,
    userName: string,
    session: Session
  ) => {
    setLastUser({ email: userEmail, full_name: userName });
    const canShowBiometric =
      isBiometricSupported() &&
      !hasBiometricPromptBeenShown();

    if (canShowBiometric) {
      isBiometricAvailable().then((available) => {
        if (available) {
          setPendingSession(session);
          setBiometricModalOpen(true);
          return;
        }
        navigate("/");
      }).catch(() => navigate("/"));
    } else {
      navigate("/");
    }
  };

  const handleBiometricYes = async () => {
    if (!pendingSession) {
      setBiometricModalOpen(false);
      navigate("/");
      return;
    }
    try {
      await storeSession(pendingSession);
      setBiometricEnabled(true);
      setBiometricPromptShown();
      setPendingSession(null);
      setBiometricModalOpen(false);
      navigate("/");
    } catch (err) {
      console.warn("[Auth] storeSession:", err);
      setBiometricPromptShown();
      setPendingSession(null);
      setBiometricModalOpen(false);
      navigate("/");
    }
  };

  const handleBiometricNo = () => {
    setBiometricPromptShown();
    setPendingSession(null);
    setBiometricModalOpen(false);
    navigate("/");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
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
        if (error.message.includes("already registered")) {
          toast.error("Este email ya está registrado. Iniciá sesión.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      if (data.session) {
        saveLastUserAndMaybeShowBiometric(
          email,
          fullName || email.split("@")[0],
          data.session
        );
      } else {
        toast.success("¡Cuenta creada! Revisá tu email para confirmar.");
        navigate("/");
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
      saveLastUserAndMaybeShowBiometric(
        data.user.email!,
        userName,
        data.session
      );
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
      if (checkingBiometric) {
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verificando identidad...</p>
          </div>
        );
      }
      return (
        <form onSubmit={handleSignIn} className="space-y-5">
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
        </form>
      );
    }

    return (
      <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
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
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-12 bg-background border-border focus:border-primary focus:ring-primary/20"
          />
          {isSignUp && <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>}
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
          <div className="flex items-center gap-3 mb-12">
            <div className="p-3 rounded-2xl gradient-primary shadow-stripe-lg">
              <Wallet className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold">Clarita la cuenta</h1>
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
            <div className="p-2 rounded-xl gradient-primary shadow-stripe">
              <Wallet className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Clarita la cuenta</h1>
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
          )}
        </div>
      </div>

      {/* Biometric setup - Drawer on mobile (iOS-native feel), AlertDialog on desktop */}
      {isMobile ? (
        <Drawer
          open={biometricModalOpen}
          onOpenChange={(open) => {
            if (!open) handleBiometricNo();
            setBiometricModalOpen(open);
          }}
        >
          <DrawerContent className="px-6 pb-safe">
            <DrawerHeader className="text-left px-0">
              <DrawerTitle>Desbloquear con Face ID</DrawerTitle>
              <DrawerDescription className="text-left">
                ¿Querés desbloquear la app con Face ID o código del teléfono la próxima vez? Podés cambiarlo después en Configuración.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="flex-col gap-2 px-0 pb-0">
              <Button onClick={handleBiometricYes} className="w-full h-12 gradient-primary">
                Sí, configurar
              </Button>
              <Button variant="outline" onClick={handleBiometricNo} className="w-full h-12">
                Ahora no
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <AlertDialog open={biometricModalOpen} onOpenChange={setBiometricModalOpen}>
          <AlertDialogContent className="max-w-sm mx-4 rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Desbloquear con Face ID</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Querés desbloquear la app con Face ID o código del teléfono la próxima vez? Podés cambiarlo después en Configuración.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={handleBiometricNo} className="w-full sm:flex-1">
                Ahora no
              </AlertDialogCancel>
              <Button onClick={handleBiometricYes} className="w-full sm:flex-1 gradient-primary">
                Sí, configurar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Auth;
