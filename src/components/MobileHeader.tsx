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
import { Clock, Target, Sparkles, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MobileHeaderProps {
  userName: string;
}

export const MobileHeader = ({ userName }: MobileHeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const menuItems = [
    { title: "Pendientes", path: "/pending", icon: Clock },
    { title: "Presupuestos", path: "/budgets", icon: Target },
    { title: "Insights", path: "/insights", icon: Sparkles },
    { title: "Configuración", path: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">
          Hola, <span className="text-primary">{userName}</span>
        </h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
