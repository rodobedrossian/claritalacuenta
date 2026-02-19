import { RuculaLogo } from "@/components/RuculaLogo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function GenZNav() {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/30">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <RuculaLogo size="md" />
        <Button
          size="sm"
          onClick={() => navigate("/auth")}
          className="rounded-full px-6 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0"
        >
          Empezar
        </Button>
      </div>
    </nav>
  );
}
