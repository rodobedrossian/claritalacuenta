import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Share, PlusSquare, Check, Download } from "lucide-react";
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallInstructions() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    
    // Check if already installed as PWA
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-500">
            <Check className="h-5 w-5" />
            App Instalada
          </CardTitle>
          <CardDescription>
            Clarita ya está instalada en tu dispositivo. ¡Disfruta de la experiencia completa!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Instalar App
        </CardTitle>
        <CardDescription>
          Agrega Clarita a tu pantalla de inicio para acceder rápidamente y recibir notificaciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick install button for supported browsers */}
        {deferredPrompt && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Download className="h-5 w-5" />
              Instalar Clarita
            </button>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Haz clic para instalar la app directamente
            </p>
          </div>
        )}

        {/* iOS Instructions */}
        {isIOS && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="text-2xl">🍎</span> iPhone / iPad
            </h3>
            <div className="space-y-4">
              <Step 
                number={1}
                icon={<Share className="h-5 w-5" />}
                title="Abre en Safari"
                description="Asegúrate de estar usando Safari (no Chrome u otro navegador)"
              />
              <Step 
                number={2}
                icon={<Share className="h-5 w-5" />}
                title="Toca el botón Compartir"
                description="Busca el ícono de compartir en la barra inferior (cuadrado con flecha hacia arriba)"
              />
              <Step 
                number={3}
                icon={<PlusSquare className="h-5 w-5" />}
                title='Selecciona "Agregar a Inicio"'
                description="Desplázate hacia abajo en el menú y toca 'Agregar a pantalla de inicio'"
              />
              <Step 
                number={4}
                icon={<Check className="h-5 w-5" />}
                title="Confirma la instalación"
                description="Toca 'Agregar' en la esquina superior derecha para completar"
              />
            </div>
          </div>
        )}

        {/* Android Instructions */}
        {isAndroid && !deferredPrompt && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="text-2xl">🤖</span> Android
            </h3>
            <div className="space-y-4">
              <Step 
                number={1}
                icon={<Smartphone className="h-5 w-5" />}
                title="Abre en Chrome"
                description="Asegúrate de estar usando Google Chrome"
              />
              <Step 
                number={2}
                icon={<Share className="h-5 w-5" />}
                title="Abre el menú"
                description="Toca los tres puntos (⋮) en la esquina superior derecha"
              />
              <Step 
                number={3}
                icon={<PlusSquare className="h-5 w-5" />}
                title='Selecciona "Instalar app"'
                description='Busca la opción "Instalar app" o "Agregar a pantalla de inicio"'
              />
              <Step 
                number={4}
                icon={<Check className="h-5 w-5" />}
                title="Confirma la instalación"
                description="Toca 'Instalar' para agregar la app a tu dispositivo"
              />
            </div>
          </div>
        )}

        {/* Desktop Instructions */}
        {!isIOS && !isAndroid && !deferredPrompt && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="text-2xl">💻</span> Escritorio (Chrome/Edge)
            </h3>
            <div className="space-y-4">
              <Step 
                number={1}
                icon={<Smartphone className="h-5 w-5" />}
                title="Busca el ícono de instalación"
                description="En la barra de direcciones, busca el ícono de instalación (⊕ o similar)"
              />
              <Step 
                number={2}
                icon={<Download className="h-5 w-5" />}
                title="Haz clic en 'Instalar'"
                description="Selecciona la opción para instalar FinanceFlow"
              />
              <Step 
                number={3}
                icon={<Check className="h-5 w-5" />}
                title="Confirma"
                description="La app se abrirá en su propia ventana y aparecerá en tu menú de aplicaciones"
              />
            </div>
          </div>
        )}

        {/* Benefits section */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 space-y-2">
          <h4 className="font-medium">✨ Beneficios de instalar la app:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Acceso rápido desde tu pantalla de inicio</li>
            <li>• Notificaciones push de presupuestos y recordatorios</li>
            <li>• Funciona sin conexión a internet</li>
            <li>• Experiencia de app nativa sin ocupar mucho espacio</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

interface StepProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function Step({ number, icon, title, description }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 font-medium">
          <span className="text-primary">{icon}</span>
          {title}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
