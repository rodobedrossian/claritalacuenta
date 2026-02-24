import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminLoginPath } from "@/lib/adminSubdomain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RuculaLogo } from "@/components/RuculaLogo";
import { LogOut, ArrowLeft, Upload } from "lucide-react";
import type { PromoImportJson } from "@/types/promotion";

const AdminPromotionNew = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [entity, setEntity] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!session) {
    navigate(getAdminLoginPath());
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmedEntity = entity.trim();
    if (!trimmedEntity) {
      setError("Indicá la entidad (ej: coto, carrefour).");
      return;
    }
    let data: PromoImportJson;
    try {
      data = JSON.parse(jsonText) as PromoImportJson;
    } catch {
      setError("El JSON no es válido. Revisá la sintaxis.");
      return;
    }
    if (!Array.isArray(data.promotions) || data.promotions.length === 0) {
      setError("El JSON debe tener un array 'promotions' con al menos un elemento.");
      return;
    }
    const dayOfWeek = Number(data.filter_day);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
      setError("El JSON debe tener 'filter_day' entre 1 (Lunes) y 7 (Domingo).");
      return;
    }

    setLoading(true);
    try {
      const rows = data.promotions.map((p) => ({
        entity: trimmedEntity,
        day_of_week: dayOfWeek,
        source: data.source ?? null,
        payload: p as unknown as import("@/integrations/supabase/types").Json,
        is_active: true,
      }));
      const { error: insertError } = await supabase.from("promotions").insert(rows);
      if (insertError) throw insertError;
      setSuccess(`Se guardaron ${rows.length} promociones para ${trimmedEntity}.`);
      setJsonText("");
    } catch (err) {
      console.error("Error saving promotions:", err);
      setError(err instanceof Error ? err.message : "Error al guardar las promociones.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(getAdminLoginPath());
  };

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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to="/admin/promotions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al listado
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Cargar promociones desde JSON
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entity">Entidad</Label>
                <Input
                  id="entity"
                  placeholder="ej: coto, carrefour"
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="json">JSON (formato de promos_example.json)</Label>
                <textarea
                  id="json"
                  className="flex min-h-[240px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder='{"filter_day": 1, "filter_day_name": "Lunes", "source": "coto.com.ar", "promotions": [...]}'
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-green-600 dark:text-green-400" role="status">
                  {success}
                </p>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Procesar y guardar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPromotionNew;
