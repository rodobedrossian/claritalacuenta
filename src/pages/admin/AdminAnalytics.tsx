import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getAdminLoginPath } from "@/lib/adminSubdomain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RuculaLogo } from "@/components/RuculaLogo";
import {
  BarChart3,
  LogOut,
  RefreshCw,
  MousePointer,
  MapPin,
  Clock,
  Smartphone,
  Monitor,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(200, 65%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(340, 65%, 50%)",
  "hsl(270, 50%, 55%)",
  "hsl(170, 55%, 45%)",
  "hsl(20, 70%, 55%)",
];

interface AnalyticsData {
  filters: { start_date: string; end_date: string; device_type: string; os: string };
  total_events: number;
  by_event_type: { name: string; count: number }[];
  top_event_names: { name: string; count: number }[];
  top_click_targets: { event_name: string; label: string; path: string; count: number; display: string }[];
  top_paths_by_clicks: { path: string; count: number }[];
  time_by_path: { path: string; total_seconds: number; sessions: number }[];
  by_device_type: { name: string; count: number }[];
  by_os: { name: string; count: number }[];
  top_users_by_events: { user_id: string; email: string; count: number }[];
}

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [deviceType, setDeviceType] = useState<string>("all");
  const [os, setOs] = useState<string>("all");

  const fetchData = async () => {
    if (!session) {
      navigate(getAdminLoginPath());
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        device_type: deviceType,
        os,
      });
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-event-analytics?${params}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (!res.ok) {
        if (res.status === 403) {
          setError("No tenés permisos de administrador");
          return;
        }
        throw new Error("Error al cargar analytics");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(getAdminLoginPath());
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const chartData = (arr: { name?: string; path?: string; count: number }[]) =>
    arr.map((x) => ({ name: x.name ?? x.path ?? "-", value: x.count }));

  const pieData = (arr: { name: string; count: number }[]) =>
    arr.filter((x) => x.name !== "unknown").map((x) => ({ name: x.name, value: x.count }));

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
            <Link to="/admin/promotions">
              <Button variant="ghost" size="sm">
                Promociones
              </Button>
            </Link>
            <Button variant="secondary" size="sm" className="font-medium" asChild>
              <Link to="/admin/analytics">Analytics</Link>
            </Button>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Desde</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Hasta</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Dispositivo</label>
              <Select value={deviceType} onValueChange={setDeviceType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Sistema operativo</label>
              <Select value={os} onValueChange={setOs}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="iOS">iOS</SelectItem>
                  <SelectItem value="Android">Android</SelectItem>
                  <SelectItem value="Windows">Windows</SelectItem>
                  <SelectItem value="macOS">macOS</SelectItem>
                  <SelectItem value="Linux">Linux</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : data ? (
          <>
            <div className="text-sm text-muted-foreground">
              {data.total_events.toLocaleString("es-AR")} eventos en el período
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Distribución por dispositivo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Smartphone className="h-4 w-4" />
                    Por dispositivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData(data.by_device_type).length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData(data.by_device_type)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        >
                          {pieData(data.by_device_type).map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => v.toLocaleString("es-AR")}
                          contentStyle={{
                            borderRadius: "0.75rem",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Sin datos
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Distribución por OS */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Monitor className="h-4 w-4" />
                    Por sistema operativo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData(data.by_os).length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData(data.by_os)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        >
                          {pieData(data.by_os).map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => v.toLocaleString("es-AR")}
                          contentStyle={{
                            borderRadius: "0.75rem",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Sin datos
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Dónde clickean más (label + path) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MousePointer className="h-4 w-4" />
                    Dónde clickean más
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-normal">
                    Label del elemento y ruta donde ocurrió el click
                  </p>
                </CardHeader>
                <CardContent>
                  {data.top_click_targets.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={chartData(
                          data.top_click_targets.map((x) => ({ name: x.display, count: x.count }))
                        )}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                          width={120}
                        />
                        <Tooltip
                          formatter={(v: number) => v.toLocaleString("es-AR")}
                          contentStyle={{
                            borderRadius: "0.75rem",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Sin datos de clicks
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Usuarios con más eventos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    Usuarios con más eventos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(data.top_users_by_events?.length ?? 0) > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={chartData(
                          (data.top_users_by_events ?? []).map((x) => ({
                            name: x.email,
                            count: x.count,
                          }))
                        )}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                          width={140}
                        />
                        <Tooltip
                          formatter={(v: number) => v.toLocaleString("es-AR")}
                          contentStyle={{
                            borderRadius: "0.75rem",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(270, 50%, 55%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Sin datos de usuarios (solo eventos de usuarios autenticados)
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Clicks por ruta */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" />
                    Clicks por ruta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.top_paths_by_clicks.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={chartData(data.top_paths_by_clicks)}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                          width={120}
                        />
                        <Tooltip
                          formatter={(v: number) => v.toLocaleString("es-AR")}
                          contentStyle={{
                            borderRadius: "0.75rem",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(200, 65%, 50%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Sin datos
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Tiempo por página - full width */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4" />
                    Dónde pasan más tiempo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.time_by_path.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={data.time_by_path.map((x) => ({
                          name: x.path,
                          value: Math.round(x.total_seconds),
                          sessions: x.sessions,
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                          tickFormatter={(v) => formatDuration(v)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                          width={120}
                        />
                        <Tooltip
                          formatter={(v: number, name: string, props: { payload?: { sessions?: number } }) => [
                            `${formatDuration(v)} (${props.payload?.sessions ?? 0} sesiones)`,
                            "Tiempo",
                          ]}
                          contentStyle={{
                            borderRadius: "0.75rem",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(170, 55%, 45%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Sin datos de tiempo (se calcula a partir de navegaciones)
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default AdminAnalytics;
