import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PrivacyContent } from "@/components/PrivacyContent";

const Legales = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 pt-safe pb-3">
          <div className="container mx-auto px-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold tracking-tight">Legales</h1>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <div className="container mx-auto px-4 py-6 max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-2">Política de Privacidad</h2>
            <p className="text-sm text-muted-foreground mb-6">Última actualización: Enero 2026</p>
            <PrivacyContent />
          </div>
        </div>

        <div className="h-[calc(72px+env(safe-area-inset-bottom,0)+2rem)] md:hidden shrink-0" />
      </div>
    </AppLayout>
  );
};

export default Legales;
