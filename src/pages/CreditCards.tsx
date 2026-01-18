import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, TrendingDown, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { StatementsList } from "@/components/credit-cards/StatementsList";
import { StatementDetail } from "@/components/credit-cards/StatementDetail";
import { InstallmentProjectionPanel } from "@/components/credit-cards/InstallmentProjectionPanel";
import { useCreditCardStatements, StatementImport } from "@/hooks/useCreditCardStatements";
import { useCreditCardsData } from "@/hooks/useCreditCardsData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Category {
  id: string;
  name: string;
  type: string;
}

const CreditCards = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<StatementImport | null>(null);

  const { statements, loading, refetch, deleteStatement } = useCreditCardStatements(userId);
  const { creditCards } = useCreditCardsData(userId);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, type")
        .order("name");
      
      if (data) {
        setCategories(data);
      }
    };
    fetchCategories();
  }, []);

  if (!userId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        {!selectedStatement && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Resúmenes de Tarjeta</h1>
              <p className="text-muted-foreground">
                Historial de resúmenes importados y detalle de consumos
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {selectedStatement ? (
          <StatementDetail
            statement={selectedStatement}
            categories={categories}
            userId={userId}
            onBack={() => setSelectedStatement(null)}
          />
        ) : (
          <Tabs defaultValue="proyeccion" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="proyeccion" className="gap-2">
                <TrendingDown className="h-4 w-4" />
                Proyección de Cuotas
              </TabsTrigger>
              <TabsTrigger value="resumenes" className="gap-2">
                <Receipt className="h-4 w-4" />
                Resúmenes de Cuenta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="proyeccion">
              <InstallmentProjectionPanel userId={userId} />
            </TabsContent>

            <TabsContent value="resumenes">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Cargando resúmenes...
                </div>
              ) : (
                <StatementsList
                  statements={statements}
                  creditCards={creditCards}
                  onSelectStatement={setSelectedStatement}
                  onDeleteStatement={deleteStatement}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
};

export default CreditCards;
