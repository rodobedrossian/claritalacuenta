import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminLoginPath } from "@/lib/adminSubdomain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldX } from "lucide-react";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const isAdmin = session?.user?.app_metadata?.role === "admin";

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate(getAdminLoginPath());
    }
  }, [authLoading, session, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(getAdminLoginPath());
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <ShieldX className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              No tenés permisos de administrador para acceder a esta sección.
            </p>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminLayout;
