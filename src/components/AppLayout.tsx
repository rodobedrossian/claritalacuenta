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
  CreditCard,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomNavigation } from "@/components/BottomNavigation";

interface AppLayoutProps {
  children: ReactNode;
  onMobileAddClick?: () => void;
}

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Transacciones", path: "/transactions", icon: Receipt },
  { title: "Pendientes", path: "/pending", icon: Clock },
  { title: "Tarjetas", path: "/credit-cards", icon: CreditCard },
  { title: "Ahorros", path: "/savings", icon: PiggyBank },
  { title: "Presupuestos", path: "/budgets", icon: Target },
  { title: "Insights", path: "/insights", icon: Sparkles },
  { title: "Configuración", path: "/settings", icon: Settings },
];

export const AppLayout = ({ children, onMobileAddClick }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

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

  // On mobile, always show expanded when open
  const showExpanded = isMobile || !isCollapsed;
  const sidebarWidth = showExpanded ? "w-64" : "w-16";

  // For mobile, we use bottom navigation instead of sidebar
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Mobile menu button for accessing secondary menu */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Overlay for mobile sidebar */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Mobile Sidebar - for secondary navigation */}
        <aside
          className={cn(
            "fixed top-0 left-0 z-40 h-screen w-64 border-r border-border/50 bg-card backdrop-blur-sm transition-transform duration-300",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg gradient-primary shrink-0">
                    <PiggyBank className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h1 className="text-lg font-bold text-foreground truncate">Clarita la cuenta</h1>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                      isActive(item.path)
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{item.title}</span>
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-border/50 p-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20">{children}</main>

        {/* Bottom Navigation */}
        <BottomNavigation onAddClick={onMobileAddClick || (() => navigate("/?action=add-transaction"))} />
      </div>
    );
  }

  // Desktop/Tablet layout with sidebar
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "sticky top-0 left-0 z-40 h-screen border-r border-border/50 bg-card backdrop-blur-sm transition-all duration-300",
          sidebarWidth
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn("border-b border-border/50", !showExpanded ? "px-2 py-4" : "p-6")}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary shrink-0">
                <PiggyBank className="h-6 w-6 text-primary-foreground" />
              </div>
              {showExpanded && <h1 className="text-lg font-bold text-foreground truncate">Clarita la cuenta</h1>}
            </div>
          </div>

          {/* Navigation */}
          <nav className={cn("flex-1 space-y-2", !showExpanded ? "p-2" : "p-4")}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={!showExpanded ? item.title : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg text-left transition-all",
                    !showExpanded ? "px-3 py-3 justify-center" : "px-4 py-3",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {showExpanded && <span className="font-medium">{item.title}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className={cn("border-t border-border/50", !showExpanded ? "p-2" : "p-4")}>
            {/* Collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all mb-2",
                !showExpanded ? "px-3 py-3 justify-center" : "px-4 py-3",
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
            <button
              onClick={handleSignOut}
              title={!showExpanded ? "Cerrar Sesión" : undefined}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all",
                !showExpanded ? "px-3 py-3 justify-center" : "px-4 py-3",
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {showExpanded && <span className="font-medium">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
};
