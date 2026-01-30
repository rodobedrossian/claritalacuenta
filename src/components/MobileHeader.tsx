import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Target, Sparkles, Settings, LogOut, Tag } from "lucide-react";
import { performLogout } from "@/lib/biometricAuth";

interface MobileHeaderProps {
  userName: string;
}

export const MobileHeader = ({ userName }: MobileHeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await performLogout();
    navigate("/auth");
  };

  const menuItems = [
    { title: "Presupuestos", path: "/budgets", icon: Target },
    { title: "Insights", path: "/insights", icon: Sparkles },
    { title: "Categorías", path: "/categories", icon: Tag },
    { title: "Configuración", path: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 pt-safe pb-2 transition-all duration-300">
      <div className="flex items-center justify-between h-12">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Hola, <span className="text-primary">{userName}</span>
        </h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border border-border shadow-stripe-lg">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)} className="cursor-pointer">
                  <Icon className="h-4 w-4 mr-2" />
                  {item.title}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
