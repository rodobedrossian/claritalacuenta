import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
interface BottomNavigationProps {
  onAddClick: () => void;
}

const mainNavItems = [
  { title: "Inicio", path: "/", icon: LayoutDashboard },
  { title: "Movimientos", path: "/transactions", icon: Receipt },
  { title: "add", path: "add", icon: Plus }, // Special add button
  { title: "Tarjetas", path: "/credit-cards", icon: CreditCard },
  { title: "Más", path: "/mas", icon: MoreHorizontal },
];

export const BottomNavigation = ({ onAddClick }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
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
