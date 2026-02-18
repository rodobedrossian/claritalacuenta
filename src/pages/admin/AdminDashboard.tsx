import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RuculaLogo } from "@/components/RuculaLogo";
import { 
  LogOut, 
  Users, 
  Activity, 
  TrendingUp,
  CreditCard,
  Receipt,
  PiggyBank,
  RefreshCw,
  AlertCircle,
  FileWarning,
  ChevronDown,
  ChevronUp,
  Bot,
  Calendar
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface UserMetrics {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  transactions_count: number;
  credit_cards_count: number;
  savings_entries_count: number;
}

interface AdminData {
  users: UserMetrics[];
  metrics: {
    total_users: number;
    active_7_days: number;
    active_30_days: number;
  };
  page: number;
  per_page: number;
  total_pages: number;
}

interface ReconciliationAlert {
  id: string;
  user_id: string;
  user_email: string | null;
  file_name: string;
  statement_month: string;
  created_at: string;
  conciliacion: {
    estado_ars: string;
    estado_usd: string;
    total_calculado_ars: number;
    total_resumen_ars: number;
    diferencia_ars: number;
    total_calculado_usd: number;
    total_resumen_usd: number;
    diferencia_usd: number;
    total_consumos_ars: number;
    total_impuestos_ars: number;
    total_ajustes_ars: number;
    total_consumos_usd: number;
    total_impuestos_usd: number;
    total_ajustes_usd: number;
  };
}

interface AIUsageStats {
  summary: {
    total_calls: number;
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_tokens: number;
    estimated_cost_usd: number;
  };
  by_function: Array<{
    function_name: string;
    calls: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    model: string;
    estimated_cost_usd: number;
  }>;
  by_user: Array<{
    user_id: string;
    email: string;
    calls: number;
    total_tokens: number;
    estimated_cost_usd: number;
  }>;
  by_day: Array<{
    date: string;
    calls: number;
    total_tokens: number;
    estimated_cost_usd: number;
  }>;
  filters: { start_date: string; end_date: string };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [reconciliationAlerts, setReconciliationAlerts] = useState<ReconciliationAlert[]>([]);
  const [reconciliationLoading, setReconciliationLoading] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsageStats | null>(null);
  const [aiUsageLoading, setAiUsageLoading] = useState(false);
  const [aiStartDate, setAiStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [aiEndDate, setAiEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const fetchData = async (page: number = 1) => {
    if (!session) {
      navigate(getAdminLoginPath());
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-admin-users?page=${page}&per_page=50`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          setError("No tenés permisos de administrador");
          return;
        }
        throw new Error("Error fetching data");
      }

      const result = await response.json();
      setData(result);
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError("Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReconciliationAlerts = async () => {
    if (!session) return;
    setReconciliationLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-statement-reconciliation-alerts`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );
      if (response.ok) {
        const { alerts } = await response.json();
        setReconciliationAlerts(alerts || []);
      }
    } catch {
      // Silently fail for reconciliation alerts
    } finally {
      setReconciliationLoading(false);
    }
  };

  const fetchAiUsage = async (start?: string, end?: string) => {
    if (!session) return;
    setAiUsageLoading(true);
    try {
      const s = start || aiStartDate;
      const e = end || aiEndDate;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-ai-usage-stats?start_date=${s}&end_date=${e}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setAiUsage(data);
      }
    } catch {
      // Silently fail
    } finally {
      setAiUsageLoading(false);
    }
  };

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (session && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData(1);
      fetchReconciliationAlerts();
      fetchAiUsage();
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(getAdminLoginPath());
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (data?.total_pages || 1)) {
      fetchData(page);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
  };

  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: es 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RuculaLogo size="sm" />
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-semibold">Backoffice</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-destructive">{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchData(currentPage)}
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{data?.metrics.total_users || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos (7 días)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-success">
                  {data?.metrics.active_7_days || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos (30 días)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-primary">
                  {data?.metrics.active_30_days || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Usuarios</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchData(currentPage)}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Fecha Alta</TableHead>
                      <TableHead>Último Login</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Receipt className="h-4 w-4" />
                          <span className="sr-only">Transacciones</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          <span className="sr-only">Tarjetas</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <PiggyBank className="h-4 w-4" />
                          <span className="sr-only">Ahorros</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.full_name || "-"}</TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">
                            {formatRelativeDate(user.last_sign_in_at)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {user.transactions_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {user.credit_cards_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {user.savings_entries_count}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data?.users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay usuarios registrados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {data && data.total_pages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {[...Array(data.total_pages)].map((_, i) => (
                          <PaginationItem key={i + 1}>
                            <PaginationLink
                              onClick={() => handlePageChange(i + 1)}
                              isActive={currentPage === i + 1}
                              className="cursor-pointer"
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={currentPage === data.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Conciliaciones con diferencias */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-amber-500" />
              Conciliaciones con diferencias
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReconciliationAlerts}
              disabled={reconciliationLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${reconciliationLoading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Importaciones de resúmenes donde la suma de consumos no coincide exactamente con el total del PDF.
            </p>
            {reconciliationLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : reconciliationAlerts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No hay importaciones con diferencias de conciliación
              </div>
            ) : (
              <div className="space-y-2">
                {reconciliationAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedAlertId((id) => (id === alert.id ? null : alert.id))}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">
                          {alert.file_name} · {alert.statement_month}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {alert.user_email || alert.user_id} · {formatRelativeDate(alert.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(alert.conciliacion.estado_ars.includes("Diferencia") ||
                          alert.conciliacion.estado_usd.includes("Diferencia")) && (
                          <Badge variant="secondary" className="text-amber-600 border-amber-500/50">
                            Revisar
                          </Badge>
                        )}
                        {expandedAlertId === alert.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    {expandedAlertId === alert.id && (
                      <div className="border-t bg-muted/30 p-4 text-sm space-y-3 font-mono">
                        <div>
                          <span className="font-semibold text-foreground">ARS:</span> Consumos + cuotas: {alert.conciliacion.total_consumos_ars.toLocaleString("es-AR")} + Impuestos: {alert.conciliacion.total_impuestos_ars.toLocaleString("es-AR")} + Ajustes: {alert.conciliacion.total_ajustes_ars.toLocaleString("es-AR")} = Calculado: {alert.conciliacion.total_calculado_ars.toLocaleString("es-AR")}. Resumen PDF: {alert.conciliacion.total_resumen_ars.toLocaleString("es-AR")}. Diferencia: {alert.conciliacion.diferencia_ars.toLocaleString("es-AR")}. {alert.conciliacion.estado_ars}
                        </div>
                        {(alert.conciliacion.total_resumen_usd !== 0 || alert.conciliacion.total_calculado_usd !== 0) && (
                          <div>
                            <span className="font-semibold text-foreground">USD:</span> Calculado: {alert.conciliacion.total_calculado_usd.toLocaleString("en-US")}. Resumen PDF: {alert.conciliacion.total_resumen_usd.toLocaleString("en-US")}. Diferencia: {alert.conciliacion.diferencia_usd.toLocaleString("en-US")}. {alert.conciliacion.estado_usd}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Uso de AI
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={aiStartDate}
                  onChange={(e) => setAiStartDate(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
                <span className="text-xs text-muted-foreground">a</span>
                <Input
                  type="date"
                  value={aiEndDate}
                  onChange={(e) => setAiEndDate(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAiUsage()}
                disabled={aiUsageLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${aiUsageLoading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {aiUsageLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !aiUsage ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No hay datos de uso de AI
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Total llamadas</p>
                    <p className="text-xl font-bold">{aiUsage.summary.total_calls}</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Tokens input</p>
                    <p className="text-xl font-bold">{aiUsage.summary.total_prompt_tokens.toLocaleString()}</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Tokens output</p>
                    <p className="text-xl font-bold">{aiUsage.summary.total_completion_tokens.toLocaleString()}</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Costo estimado</p>
                    <p className="text-xl font-bold text-primary">${aiUsage.summary.estimated_cost_usd.toFixed(4)}</p>
                  </div>
                </div>

                {/* By function */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Por función</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Función</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead className="text-right">Llamadas</TableHead>
                        <TableHead className="text-right">Input tokens</TableHead>
                        <TableHead className="text-right">Output tokens</TableHead>
                        <TableHead className="text-right">Costo (USD)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aiUsage.by_function.map((fn) => (
                        <TableRow key={fn.function_name}>
                          <TableCell className="font-medium text-xs">{fn.function_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{fn.model}</TableCell>
                          <TableCell className="text-right">{fn.calls}</TableCell>
                          <TableCell className="text-right">{fn.prompt_tokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{fn.completion_tokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">${fn.estimated_cost_usd.toFixed(4)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* By user */}
                {aiUsage.by_user.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Por usuario</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead className="text-right">Llamadas</TableHead>
                          <TableHead className="text-right">Tokens totales</TableHead>
                          <TableHead className="text-right">Costo (USD)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aiUsage.by_user.map((u) => (
                          <TableRow key={u.user_id}>
                            <TableCell className="font-medium text-xs">{u.email}</TableCell>
                            <TableCell className="text-right">{u.calls}</TableCell>
                            <TableCell className="text-right">{u.total_tokens.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono">${u.estimated_cost_usd.toFixed(4)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
