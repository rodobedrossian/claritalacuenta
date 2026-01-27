import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { toast } from "sonner";
import { CreditCard, Repeat, Bell, Plus } from "lucide-react";
import { useCreditCardsData } from "@/hooks/useCreditCardsData";
import { useRecurringExpensesData } from "@/hooks/useRecurringExpensesData";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { AddCreditCardDialog } from "@/components/credit-cards/AddCreditCardDialog";
import { CreditCardsList } from "@/components/credit-cards/CreditCardsList";
import { AddRecurringExpenseDialog } from "@/components/recurring/AddRecurringExpenseDialog";
import { RecurringExpensesList } from "@/components/recurring/RecurringExpensesList";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Credit cards hook
  const { creditCards, addCreditCard, deleteCreditCard } = useCreditCardsData(userId);
  
  // Recurring expenses hook
  const { 
    recurringExpenses, 
    addRecurringExpense, 
    deleteRecurringExpense, 
    generateTransaction 
  } = useRecurringExpensesData(userId);
  
  // Push notifications hook
  const pushNotifications = usePushNotifications(userId);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setLoading(false);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  if (loading || pushNotifications.loading) {
    return (
      <AppLayout>
        <SettingsSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 pt-safe pb-3 transition-all duration-300">
          <div className="container mx-auto px-4 md:px-6 py-2 pl-14 md:pl-6">
            <div className="h-10 flex items-center">
              <h1 className="text-xl font-bold tracking-tight">Configuración</h1>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          <Tabs defaultValue="cards" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="cards" className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Tarjetas</span>
                <span className="sm:hidden text-xs">Tarjetas</span>
              </TabsTrigger>
              <TabsTrigger value="recurring" className="gap-2">
                <Repeat className="h-4 w-4" />
                <span className="hidden sm:inline">Recurrentes</span>
                <span className="sm:hidden text-xs">Recurrentes</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notificaciones</span>
                <span className="sm:hidden text-xs">Alertas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cards" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Tarjetas de crédito</CardTitle>
                      <CardDescription>
                        Administra tus tarjetas para importar resúmenes
                      </CardDescription>
                    </div>
                    <AddCreditCardDialog onAdd={addCreditCard} />
                  </div>
                </CardHeader>
                <CardContent>
                  <CreditCardsList 
                    creditCards={creditCards} 
                    onDelete={deleteCreditCard} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recurring" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Gastos recurrentes</CardTitle>
                      <CardDescription>
                        Configura gastos que se repiten todos los meses
                      </CardDescription>
                    </div>
                    <AddRecurringExpenseDialog onAdd={addRecurringExpense} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => generateTransaction()}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Generar este mes
                    </Button>
                  </div>
                  <RecurringExpensesList 
                    expenses={recurringExpenses} 
                    onDelete={deleteRecurringExpense}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationSettings
                isSupported={pushNotifications.isSupported}
                isPWA={pushNotifications.isPWA}
                platform={pushNotifications.platform}
                permission={pushNotifications.permission}
                subscriptions={pushNotifications.subscriptions}
                settings={pushNotifications.settings}
                loading={pushNotifications.loading}
                subscribing={pushNotifications.subscribing}
                onSubscribe={pushNotifications.subscribe}
                onUnsubscribe={pushNotifications.unsubscribe}
                onResetSubscription={pushNotifications.resetSubscription}
                onUpdateSettings={pushNotifications.updateSettings}
                onSendTest={pushNotifications.sendTestNotification}
              />
            </TabsContent>
          </Tabs>
        </main>
        
        <div className="h-[calc(72px+env(safe-area-inset-bottom,0)+2rem)] md:hidden" />
      </div>
    </AppLayout>
  );
}
