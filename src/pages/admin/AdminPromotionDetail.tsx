import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminLoginPath } from "@/lib/adminSubdomain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RuculaLogo } from "@/components/RuculaLogo";
import { LogOut, ArrowLeft } from "lucide-react";
import { DAY_NAMES } from "@/types/promotion";
import type { Database } from "@/integrations/supabase/types";

type PromotionRow = Database["public"]["Tables"]["promotions"]["Row"];

const AdminPromotionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [promo, setPromo] = useState<PromotionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      navigate(getAdminLoginPath());
      return;
    }
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("id", id)
        .single();
      if (cancelled) return;
      if (error) setPromo(null);
      else setPromo(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session, id, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(getAdminLoginPath());
  };

  if (!session) return null;
  if (loading || !id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }
  if (!promo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">No se encontró la promoción.</p>
            <Button asChild>
              <Link to="/admin/promotions">Volver al listado</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const payload = (promo.payload || {}) as Record<string, unknown>;
  const payloadEntries = Object.entries(payload).filter(
    ([_, v]) => v !== null && v !== undefined && v !== ""
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RuculaLogo size="sm" />
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-semibold">Backoffice</h1>
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/promotions">Promociones</Link>
            </Button>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to="/admin/promotions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al listado
          </Link>
        </Button>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Detalle de la promoción</CardTitle>
            <Badge variant={promo.is_active ? "default" : "secondary"}>
              {promo.is_active ? "Activa" : "Inactiva"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Entidad</dt>
                <dd className="font-medium">{promo.entity}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Día</dt>
                <dd className="font-medium">{DAY_NAMES[promo.day_of_week] ?? promo.day_of_week}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Origen</dt>
                <dd className="font-medium">{promo.source ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Creada</dt>
                <dd className="font-medium">
                  {new Date(promo.created_at).toLocaleString("es-AR")}
                </dd>
              </div>
            </dl>
            <div>
              <h3 className="text-sm font-semibold mb-2">Datos de la promo (payload)</h3>
              <div className="rounded-md border bg-muted/30 p-4">
                <dl className="space-y-2 text-sm font-mono">
                  {payloadEntries.map(([key, value]) => (
                    <div key={key} className="flex gap-2 flex-wrap">
                      <dt className="text-muted-foreground shrink-0">{key}:</dt>
                      <dd className="break-all">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </dd>
                    </div>
                  ))}
                  {payloadEntries.length === 0 && (
                    <p className="text-muted-foreground">Sin datos adicionales</p>
                  )}
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPromotionDetail;
