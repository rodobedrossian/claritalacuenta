import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, TrendingDown, Receipt, Upload, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { StatementsList } from "@/components/credit-cards/StatementsList";
import { StatementDetail } from "@/components/credit-cards/StatementDetail";
import { MonthlyDetailView } from "@/components/credit-cards/MonthlyDetailView";
import { InstallmentProjectionPanel } from "@/components/credit-cards/InstallmentProjectionPanel";
import { ImportStatementDialog } from "@/components/credit-cards/ImportStatementDialog";
import { AddCreditCardDialog } from "@/components/credit-cards/AddCreditCardDialog";
import { CreditCardsList } from "@/components/credit-cards/CreditCardsList";
import { CreditCardsSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useCreditCardStatements, StatementImport, CreditCardTransaction } from "@/hooks/useCreditCardStatements";
import { useCreditCardsData } from "@/hooks/useCreditCardsData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthlyTransactions, setMonthlyTransactions] = useState<CreditCardTransaction[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { statements, loading, refetch, deleteStatement, getMonthlyTransactions, getMonthlyTotals, getStatementTotals } = useCreditCardStatements(userId);
  const { creditCards, addCreditCard, deleteCreditCard } = useCreditCardsData(userId);

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

  // Handle viewing monthly analytics
  const handleViewMonthlyAnalytics = async (month: string) => {
    setLoadingMonthly(true);
    setSelectedMonth(month);
    
    try {
      const transactions = await getMonthlyTransactions(month);
      setMonthlyTransactions(transactions);
    } catch (error) {
      console.error("Error loading monthly transactions:", error);
    } finally {
      setLoadingMonthly(false);
    }
  };

  // Handle going back from monthly view
  const handleBackFromMonthly = () => {
    setSelectedMonth(null);
    setMonthlyTransactions([]);
  };

  if (!userId) {
    return (
      <AppLayout>
        <CreditCardsSkeleton />
      </AppLayout>
    );
  }

  // Determine which view to show
  const renderContent = () => {
    // Monthly analytics view
    if (selectedMonth) {
      return (
        <MonthlyDetailView
          month={selectedMonth}
          transactions={monthlyTransactions}
          categories={categories}
          creditCards={creditCards}
          loading={loadingMonthly}
          onBack={handleBackFromMonthly}
        />
      );
    }

    // Individual statement detail
    if (selectedStatement) {
      return (
        <StatementDetail
          statement={selectedStatement}
          categories={categories}
          userId={userId}
          onBack={() => setSelectedStatement(null)}
        />
      );
    }

    // Main tabbed view
    return (
      <Tabs defaultValue="proyeccion" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="proyeccion" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Proyección
          </TabsTrigger>
          <TabsTrigger value="resumenes" className="gap-2">
            <Receipt className="h-4 w-4" />
            Resúmenes
          </TabsTrigger>
          <TabsTrigger value="tarjetas" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Mis Tarjetas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proyeccion">
          <InstallmentProjectionPanel userId={userId} />
        </TabsContent>

        <TabsContent value="resumenes">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setImportDialogOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Importar Resumen
              </Button>
            </div>
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
                onViewMonthlyAnalytics={handleViewMonthlyAnalytics}
                getMonthlyTotals={getMonthlyTotals}
                getStatementTotals={getStatementTotals}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="tarjetas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Administrar Tarjetas
              </CardTitle>
              <CardDescription>
                Registra tus tarjetas de crédito para importar resúmenes y hacer seguimiento de gastos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddCreditCardDialog onAdd={addCreditCard} />
              <CreditCardsList creditCards={creditCards} onDelete={deleteCreditCard} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch">
        {/* Header - only show when not in detail views */}
        {!selectedStatement && !selectedMonth && (
          <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 pt-safe pb-3 transition-all duration-300">
            <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
              <div className="h-10 flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Tarjetas</h1>
                </div>
              </div>
            </div>
          </header>
        )}

        <main className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* Content */}
          {renderContent()}
        </main>

        {/* Spacer to clear bottom nav */}
        <div className="h-[calc(72px+env(safe-area-inset-bottom,0)+2rem)] md:hidden" />

        <ImportStatementDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          userId={userId}
          creditCards={creditCards}
          onSuccess={refetch}
          onAddCard={addCreditCard}
        />
      </div>
    </AppLayout>
  );
};

export default CreditCards;
