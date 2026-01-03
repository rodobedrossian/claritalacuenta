import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Receipt, 
  Clock, 
  PiggyBank, 
  Target,
  Settings, 
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Transacciones", path: "/transactions", icon: Receipt },
  { title: "Pendientes", path: "/pending", icon: Clock },
  { title: "Tarjetas", path: "/credit-cards", icon: CreditCard },
  { title: "Ahorros", path: "/savings", icon: PiggyBank },
  { title: "Presupuestos", path: "/budgets", icon: Target },
  { title: "Configuración", path: "/settings", icon: Settings },
];

export const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  const sidebarWidth = isCollapsed ? "w-16" : "w-64";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-40 h-screen border-r border-border/50 bg-card backdrop-blur-sm transition-all duration-300",
        sidebarWidth,
        isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn("p-4 border-b border-border/50", isCollapsed ? "px-2" : "p-6")}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary shrink-0">
                <PiggyBank className="h-6 w-6 text-primary-foreground" />
              </div>
              {!isCollapsed && (
                <h1 className="text-lg font-bold text-foreground truncate">
                  ¿Y si ahorramos?
                </h1>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className={cn("flex-1 space-y-2", isCollapsed ? "p-2" : "p-4")}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setIsOpen(false);
                  }}
                  title={isCollapsed ? item.title : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg text-left transition-all",
                    isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.title}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className={cn("border-t border-border/50", isCollapsed ? "p-2" : "p-4")}>
            {/* Desktop collapse toggle */}
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all mb-2",
                  isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3"
                )}
                title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
              >
                {isCollapsed ? (
                  <PanelLeft className="h-5 w-5 shrink-0" />
                ) : (
                  <>
                    <PanelLeftClose className="h-5 w-5 shrink-0" />
                    <span className="font-medium">Colapsar</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleSignOut}
              title={isCollapsed ? "Cerrar Sesión" : undefined}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all",
                isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3"
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="font-medium">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
};