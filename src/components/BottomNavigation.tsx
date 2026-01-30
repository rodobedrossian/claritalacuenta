import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  PiggyBank,
  Plus,
  Settings,
  Target,
  Sparkles,
  Clock,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { performLogout } from "@/lib/biometricAuth";

interface BottomNavigationProps {
  onAddClick: () => void;
}

const mainNavItems = [
  { title: "Inicio", path: "/", icon: LayoutDashboard },
  { title: "Movimientos", path: "/transactions", icon: Receipt },
  { title: "add", path: "add", icon: Plus }, // Special add button
  { title: "Tarjetas", path: "/credit-cards", icon: CreditCard },
  { title: "Ahorros", path: "/savings", icon: PiggyBank },
];

const secondaryNavItems = [
  { title: "Pendientes", path: "/pending", icon: Clock },
  { title: "Presupuestos", path: "/budgets", icon: Target },
  { title: "Insights", path: "/insights", icon: Sparkles },
  { title: "Configuración", path: "/settings", icon: Settings },
];

export const BottomNavigation = ({ onAddClick }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await performLogout();
    navigate("/auth");
  };

  return (
    <nav className="shrink-0 z-50 md:hidden bg-background/80 backdrop-blur-xl border-t border-border safe-area-bottom transition-all duration-300">
      <div className="flex items-center justify-around h-[72px] px-2">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          
          // Special handling for the add button
          if (item.path === "add") {
            return (
              <button
                key="add"
                onClick={onAddClick}
                className="flex flex-col items-center justify-center -mt-8 active:scale-95 transition-transform"
              >
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-stripe-lg border-4 border-background">
                  <Plus className="h-8 w-8 text-primary-foreground" />
                </div>
              </button>
            );
          }

          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 min-w-[64px] py-2 transition-all active:opacity-70",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-6 w-6 transition-transform", active && "scale-110")} strokeWidth={active ? 2.5 : 2} />
              <span className={cn(
                "text-[10px] font-bold tracking-tight",
                active ? "text-primary" : "text-muted-foreground/80"
              )}>
                {item.title}
              </span>
            </button>
          );
        })}
      </div>

    </nav>
  );
};

interface MoreDrawerProps {
  items: typeof secondaryNavItems;
  currentPath: string;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
}

const MoreDrawer = ({ items, currentPath, onNavigate, onSignOut }: MoreDrawerProps) => {
  const isActive = (path: string) => currentPath.startsWith(path);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-10 right-3 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4 mr-1" />
          <span className="text-xs">Más</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-card border-border">
        <DrawerHeader className="text-left">
          <DrawerTitle>Menú</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </button>
            );
          })}
          
          <div className="pt-4 border-t border-border mt-4">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
