import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Home, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const HUMOR_MESSAGES: { title: string; subtitle: string }[] = [
  {
    title: "Algo se desbalanceó (como mis finanzas en enero).",
    subtitle:
      "Hasta las mejores apps tienen un mal día. Nosotros ya estamos trabajando en no repetirlo.",
  },
  {
    title: "Este error no estaba en el presupuesto.",
    subtitle:
      "Algo salió mal por acá. Volvé al inicio y seguimos. Si se repite, contanos.",
  },
  {
    title: "La app se fue de compras sin avisar.",
    subtitle:
      "Volvé al inicio y seguimos. Prometemos no gastar más de lo que tenés.",
  },
];

interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const navigate = useNavigate();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { title, subtitle } = useMemo(
    () => HUMOR_MESSAGES[Math.floor(Math.random() * HUMOR_MESSAGES.length)],
    []
  );

  const handleGoHome = () => {
    resetErrorBoundary();
    navigate("/");
  };

  const handleRetry = () => {
    resetErrorBoundary();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-sm mt-1">{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error?.message && (
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="text-muted-foreground text-xs">Detalles técnicos</span>
                  {detailsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="mt-2 p-3 rounded-lg bg-muted text-xs text-muted-foreground overflow-auto max-h-32">
                  {error.message}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button onClick={handleGoHome} className="w-full sm:flex-1" size="lg">
            <Home className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
          <Button
            onClick={handleRetry}
            variant="outline"
            className="w-full sm:flex-1"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
