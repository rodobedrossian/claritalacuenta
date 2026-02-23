import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminLoginPath } from "@/lib/adminSubdomain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RuculaLogo } from "@/components/RuculaLogo";
import { LogOut, Plus, RefreshCw, Eye, Tag } from "lucide-react";
import { DAY_NAMES } from "@/types/promotion";
import type { Database } from "@/integrations/supabase/types";

type PromotionRow = Database["public"]["Tables"]["promotions"]["Row"];

const AdminPromotions = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [list, setList] = useState<PromotionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchList = async () => {
    if (!session) {
      navigate(getAdminLoginPath());
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setList(data ?? []);
    } catch (err) {
      console.error("Error fetching promotions:", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchList();
  }, [session]);

  const handleToggleActive = async (row: PromotionRow) => {
    setTogglingId(row.id);
    try {
      const { error } = await supabase
        .from("promotions")
        .update({ is_active: !row.is_active })
        .eq("id", row.id);
      if (error) throw error;
      setList((prev) =>
        prev.map((p) => (p.id === row.id ? { ...p, is_active: !p.is_active } : p))
      );
    } catch (err) {
      console.error("Error toggling promotion:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(getAdminLoginPath());
  };

  const getBenefit = (payload: PromotionRow["payload"]) => {
    if (payload && typeof payload === "object" && "benefit" in payload) {
      return String((payload as { benefit?: string }).benefit ?? "-");
    }
    return "-";
  };

  const getPaymentMethods = (payload: PromotionRow["payload"]): string[] => {
    if (!payload || typeof payload !== "object" || !("payment_methods" in payload)) return [];
    const pm = (payload as { payment_methods?: unknown }).payment_methods;
    if (!Array.isArray(pm)) return [];
    return pm.map((x) => (typeof x === "string" ? x : String(x)));
  };

  const getBankLogo = (payload: PromotionRow["payload"]): string | null => {
    if (!payload || typeof payload !== "object" || !("bank_logo" in payload)) return null;
    const url = (payload as { bank_logo?: unknown }).bank_logo;
    return typeof url === "string" && url ? url : null;
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
            <Button variant="ghost" size="sm" className="font-medium" asChild>
              <Link to="/admin/promotions">Promociones</Link>
            </Button>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Promociones
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/promotions/eligible">Usuarios elegibles</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={fetchList} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button size="sm" asChild>
                <Link to="/admin/promotions/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva carga
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Día</TableHead>
                    <TableHead className="w-[52px]">Banco</TableHead>
                    <TableHead>Beneficio</TableHead>
                    <TableHead>Medios de pago</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.entity}</TableCell>
                      <TableCell>{DAY_NAMES[row.day_of_week] ?? row.day_of_week}</TableCell>
                      <TableCell className="w-[52px]">
                        <div className="flex items-center justify-center w-10 h-8">
                          {(() => {
                            const logoUrl = getBankLogo(row.payload);
                            if (!logoUrl) return <span className="text-muted-foreground text-xs">—</span>;
                            return (
                              <>
                                <img
                                  src={logoUrl}
                                  alt=""
                                  className="h-8 w-8 rounded object-contain bg-muted/50"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const next = e.currentTarget.nextElementSibling;
                                    if (next) (next as HTMLElement).style.display = "inline";
                                  }}
                                />
                                <span className="text-muted-foreground text-xs" style={{ display: "none" }}>—</span>
                              </>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={getBenefit(row.payload)}>
                        {getBenefit(row.payload)}
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        {(() => {
                          const methods = getPaymentMethods(row.payload);
                          if (methods.length === 0) return <span className="text-muted-foreground">—</span>;
                          return (
                            <span className="text-sm" title={methods.join(", ")}>
                              {methods.join(", ")}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {row.source ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.is_active ? "default" : "secondary"}>
                          {row.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={togglingId === row.id}
                          onClick={() => handleToggleActive(row)}
                          className="mr-2"
                        >
                          {togglingId === row.id ? "..." : row.is_active ? "Desactivar" : "Activar"}
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/promotions/${row.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {list.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay promociones cargadas. Cargá un JSON desde "Nueva carga".
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPromotions;
