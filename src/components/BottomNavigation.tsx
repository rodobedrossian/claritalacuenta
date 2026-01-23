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
import { supabase } from "@/integrations/supabase/client";

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
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          
          // Special handling for the add button
          if (item.path === "add") {
            return (
              <button
                key="add"
                onClick={onAddClick}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Plus className="h-7 w-7 text-primary-foreground" />
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
                "flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 transition-all",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110")} />
              <span className={cn(
                "text-[10px] font-medium",
                active && "text-primary"
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
      <DrawerContent>
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
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </button>
            );
          })}
          
          <div className="pt-4 border-t border-border/50 mt-4">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
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
