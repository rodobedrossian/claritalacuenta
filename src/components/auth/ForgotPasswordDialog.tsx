import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

const ForgotPasswordDialog = ({ open, onOpenChange, defaultEmail = "" }: ForgotPasswordDialogProps) => {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Ingresá tu email");
      return;
    }

    setLoading(true);

    try {
      // Use production domain for password reset redirect
      const productionDomain = "https://www.rucula.app";
      const redirectTo = `${productionDomain}/reset-password`;
      const { data, error } = await supabase.functions.invoke("send-password-reset", {
        body: { email, redirectTo },
      });

      if (error) {
        toast.error("Error al enviar el email. Intentá más tarde.");
        return;
      }

      if (data?.error === "rate_limit") {
        toast.error("Demasiados intentos. Esperá unos minutos.");
        return;
      }

      setSent(true);
    } catch (_err) {
      toast.error("Error al enviar el email. Intentá más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setSent(false);
      setEmail(defaultEmail);
    }, 300);
  };

  const content = sent ? (
    <div className="flex flex-col items-center text-center py-6">
      <div className="p-3 rounded-full bg-success/20 mb-4">
        <Check className="h-8 w-8 text-success" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">¡Email enviado!</h3>
      <p className="text-muted-foreground mb-6">
        Si existe una cuenta con <strong>{email}</strong>, recibirás un email con instrucciones para restablecer tu contraseña.
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        Revisá también tu carpeta de spam.
      </p>
      <Button onClick={handleClose} className="gradient-primary">
        Entendido
      </Button>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="reset-email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 pl-10 bg-background border-border focus:border-primary focus:ring-primary/20"
            autoFocus
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full h-12 gradient-primary hover:opacity-90"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar instrucciones"
        )}
      </Button>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="px-6 pb-safe">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle>Recuperar contraseña</DrawerTitle>
            <DrawerDescription className="text-left">
              {!sent && "Te enviaremos un email con instrucciones para restablecer tu contraseña."}
            </DrawerDescription>
          </DrawerHeader>
          {content}
          {!sent && (
            <DrawerFooter className="px-0 pb-0">
              <Button variant="ghost" onClick={handleClose} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Recuperar contraseña</DialogTitle>
          <DialogDescription>
            {!sent && "Te enviaremos un email con instrucciones para restablecer tu contraseña."}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
