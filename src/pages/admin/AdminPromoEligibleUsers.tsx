import { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RuculaLogo } from "@/components/RuculaLogo";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { LogOut, Users, RefreshCw, Eye } from "lucide-react";
import { DAY_NAMES } from "@/types/promotion";

interface CardInfo {
  bank: string | null;
  card_network: string | null;
}

interface MatchedPromo {
  id: string;
  entity: string;
  day_of_week: number;
  benefit: string | null;
  subtitle: string | null;
  bank_logo: string | null;
}

interface EligibleUser {
  id: string;
  email: string;
  full_name: string | null;
  cards: CardInfo[];
  matched_promos: MatchedPromo[];
}

function getCurrentDayOfWeek(): number {
  return ((new Date().getDay() + 6) % 7) + 1;
}

const AdminPromoEligibleUsers = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [users, setUsers] = useState<EligibleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState<string>(() => String(getCurrentDayOfWeek()));
  const [promosDialogUser, setPromosDialogUser] = useState<EligibleUser | null>(null);

  const fetchData = useCallback(async (pageNum: number, day: string) => {
    if (!session) {
      navigate(getAdminLoginPath());
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        per_page: "50",
      });
      if (day !== "all" && day !== "") {
        params.set("day_of_week", day);
      }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-promo-eligible-users?${params}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 403) {
          setError("No tenés permisos de administrador");
          return;
        }
        throw new Error("Error al cargar datos");
      }
      const data = await response.json();
      setUsers(data.users ?? []);
      setTotalPages(data.total_pages ?? 1);
      setPage(data.page ?? 1);
    } catch (err) {
      console.error("Error fetching eligible users:", err);
      setError("Error al cargar los usuarios elegibles");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [session, navigate]);

  useEffect(() => {
    if (session) {
      fetchData(1, dayOfWeek === "all" ? "all" : dayOfWeek);
    }
  }, [session, dayOfWeek]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchData(newPage, dayOfWeek === "all" ? "all" : dayOfWeek);
    }
  };

  const handleDayChange = (value: string) => {
    setDayOfWeek(value === "all" ? "all" : value);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(getAdminLoginPath());
  };

  const formatCardsSummary = (cards: CardInfo[]): string => {
    if (!cards.length) return "—";
    return cards
      .map((c) => {
        if (!c.bank && !c.card_network) return "—";
        if (c.bank && c.card_network) return `${c.bank} (${c.card_network})`;
        return c.bank ?? c.card_network ?? "—";
      })
      .join(", ");
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
            <Button variant="ghost" size="sm" className="font-medium" asChild>
              <Link to="/admin/promotions/eligible">Usuarios elegibles</Link>
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
              <Users className="h-5 w-5" />
              Usuarios elegibles
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Día:</span>
              <Select value={dayOfWeek} onValueChange={handleDayChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los días</SelectItem>
                  {(Object.entries(DAY_NAMES) as [string, string][]).map(([num, name]) => (
                    <SelectItem key={num} value={num}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(page, dayOfWeek === "all" ? "all" : dayOfWeek)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="text-sm text-destructive mb-4" role="alert">
                {error}
              </p>
            )}
            {loading ? (
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
                      <TableHead>Usuario</TableHead>
                      <TableHead>Tarjetas</TableHead>
                      <TableHead className="w-[120px]">Promos coincidentes</TableHead>
                      <TableHead className="text-right w-[120px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.email}</div>
                            {user.full_name && (
                              <div className="text-sm text-muted-foreground">{user.full_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[280px] text-sm">
                          {formatCardsSummary(user.cards)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{user.matched_promos.length}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPromosDialogUser(user)}
                            disabled={user.matched_promos.length === 0}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver promos
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No hay usuarios en esta página o no hay promociones activas para el día
                          seleccionado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(page - 1)}
                            className={
                              page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {[...Array(totalPages)].map((_, i) => (
                          <PaginationItem key={i + 1}>
                            <PaginationLink
                              onClick={() => handlePageChange(i + 1)}
                              isActive={page === i + 1}
                              className="cursor-pointer"
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(page + 1)}
                            className={
                              page === totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
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
      </main>

      <Dialog open={!!promosDialogUser} onOpenChange={(open) => !open && setPromosDialogUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Promos para {promosDialogUser?.email ?? ""}
              {promosDialogUser?.full_name && (
                <span className="text-muted-foreground font-normal ml-2">
                  ({promosDialogUser.full_name})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto space-y-3 pr-2">
            {promosDialogUser?.matched_promos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay promos coincidentes.</p>
            ) : (
              promosDialogUser?.matched_promos.map((promo) => (
                <div
                  key={promo.id}
                  className="border rounded-lg p-3 flex gap-3 items-start text-sm"
                >
                  {promo.bank_logo && (
                    <img
                      src={promo.bank_logo}
                      alt=""
                      className="h-10 w-10 rounded object-contain bg-muted/50 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {promo.entity} · {DAY_NAMES[promo.day_of_week] ?? promo.day_of_week}
                    </div>
                    {promo.benefit && (
                      <div className="text-primary">{promo.benefit}</div>
                    )}
                    {promo.subtitle && (
                      <div className="text-muted-foreground text-xs mt-1">{promo.subtitle}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPromoEligibleUsers;
