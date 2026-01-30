import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Target, Sparkles, Settings, LogOut, Tag, Repeat, PiggyBank, ChevronDown, Info } from "lucide-react";
import { performLogout } from "@/lib/biometricAuth";
import { cn } from "@/lib/utils";

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
    </AppLayout>
  );
}
