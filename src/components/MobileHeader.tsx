import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInviteDrawer } from "@/contexts/InviteDrawerContext";

interface MobileHeaderProps {
  userName: string;
}

export const MobileHeader = ({ userName }: MobileHeaderProps) => {
  const { openDrawer } = useInviteDrawer();

  return (
    <header className="sticky top-0 z-40 px-4 pt-safe pb-1" style={{ background: "var(--gradient-hero)" }}>
      <div className="flex items-center justify-between h-10">
        <h1 className="text-base font-bold tracking-tight text-white/90">
          Hola, <span className="text-white">{userName}</span>
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={openDrawer}
          title="Invitar al espacio"
          className="h-9 w-9 rounded-full text-white/80 hover:text-white hover:bg-white/15"
        >
          <UserPlus className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
