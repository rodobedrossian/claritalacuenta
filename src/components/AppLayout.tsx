import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Target,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  CreditCard,
  Sparkles,
  Tag,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { performLogout } from "@/lib/biometricAuth";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomNavigation } from "@/components/BottomNavigation";
import { AddTransactionMethodSheet } from "@/components/AddTransactionMethodSheet";

interface AppLayoutProps {
  children: ReactNode;
  onMobileAddClick?: () => void;
}

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Transacciones", path: "/transactions", icon: Receipt },
  { title: "Tarjetas", path: "/credit-cards", icon: CreditCard },
  { title: "Ahorros", path: "/savings", icon: PiggyBank },
  { title: "Presupuestos", path: "/budgets", icon: Target },
  { title: "Recurrentes", path: "/recurrentes", icon: Repeat },
  { title: "Insights", path: "/insights", icon: Sparkles },
  { title: "Categorías", path: "/categories", icon: Tag },
  { title: "Configuración", path: "/settings", icon: Settings },
];

export const AppLayout = ({ children, onMobileAddClick }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [addMethodSheetOpen, setAddMethodSheetOpen] = useState(false);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleSignOut = async () => {
    await performLogout();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  // On mobile, always show expanded when open
  const showExpanded = isMobile || !isCollapsed;
  const sidebarWidth = showExpanded ? "w-64" : "w-16";

  // For mobile, we use bottom navigation; "+" opens choice sheet (manual vs voice)
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
        {/* Main content area - scroll handled by individual pages */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {children}
        </main>

        {/* Bottom Navigation: "+" opens method sheet so user can pick Manual or Voice from any screen */}
        <BottomNavigation
          onAddClick={() => setAddMethodSheetOpen(true)}
        />

        <AddTransactionMethodSheet
          open={addMethodSheetOpen}
          onOpenChange={setAddMethodSheetOpen}
          onSelectManual={() => navigate("/?action=add-transaction", { replace: true })}
          onSelectVoice={() => navigate("/?action=voice-record", { replace: true })}
        />
      </div>
    );
  }

  // Desktop/Tablet layout with sidebar
  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "sticky top-0 left-0 z-40 h-screen border-r border-border bg-background shadow-stripe transition-all duration-300",
          sidebarWidth
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn("border-b border-border", !showExpanded ? "px-2 py-4" : "p-6")}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl gradient-primary shrink-0">
                <PiggyBank className="h-6 w-6 text-primary-foreground" />
              </div>
              {showExpanded && <h1 className="text-lg font-bold text-foreground truncate">Clarita la cuenta</h1>}
            </div>
          </div>

          {/* Navigation */}
          <nav className={cn("flex-1 space-y-1", !showExpanded ? "p-2" : "p-4")}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={!showExpanded ? item.title : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl text-left transition-all duration-150",
                    !showExpanded ? "px-3 py-3 justify-center" : "px-4 py-3",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary font-medium"
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
          <div className={cn("border-t border-border", !showExpanded ? "p-2" : "p-4")}>
            {/* Collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all mb-2",
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
                "w-full flex items-center gap-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all",
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
