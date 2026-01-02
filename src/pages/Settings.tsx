import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Plus, Trash2, RefreshCw, Loader2, CreditCard, Repeat, Bell, Smartphone } from "lucide-react";
import { useCreditCardsData } from "@/hooks/useCreditCardsData";
import { useRecurringExpensesData } from "@/hooks/useRecurringExpensesData";
import { useCategoriesData } from "@/hooks/useCategoriesData";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { AddCreditCardDialog } from "@/components/credit-cards/AddCreditCardDialog";
import { CreditCardsList } from "@/components/credit-cards/CreditCardsList";
import { AddRecurringExpenseDialog } from "@/components/recurring/AddRecurringExpenseDialog";
import { RecurringExpensesList } from "@/components/recurring/RecurringExpensesList";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { PWAInstallInstructions } from "@/components/pwa/PWAInstallInstructions";

interface GmailConnection {
  id: string;
  email: string;
  created_at: string;
  watch_expiration: string | null;
}

interface EmailParser {
  id: string;
  name: string;
  sender_email: string;
  subject_pattern: string | null;
  amount_regex: string;
  currency: string;
  category: string;
  transaction_type: string;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

const PARSER_TEMPLATES = [
  {
    name: "DolarApp - Transferencias ARS",
    sender_email: "no-reply@dolarapp.com",
    subject_pattern: "Enviaste|Transferencia.*enviada",
    amount_regex: "([\\d.,]+)\\s*ARS",
    currency: "ARS",
    transaction_type: "expense",
  },
  {
    name: "DolarApp - Transferencias USD",
    sender_email: "no-reply@dolarapp.com",
    subject_pattern: "Enviaste|Transferencia.*enviada",
    amount_regex: "([\\d.,]+)\\s*USD",
    currency: "USD",
    transaction_type: "expense",
  },
  {
    name: "Mercado Pago - Pagos",
    sender_email: "info@mercadopago.com",
    subject_pattern: "Pagaste|Compraste",
    amount_regex: "\\$\\s*([\\d.,]+)",
    currency: "ARS",
    transaction_type: "expense",
  },
  {
    name: "Wise - Dinero recibido USD",
    sender_email: "noreply@wise.com",
    subject_pattern: "acaba de enviarte dinero",
    amount_regex: "recibido\\s*([\\d.,]+)\\s*USD|Cantidad recibida:\\s*([\\d.,]+)\\s*USD",
    currency: "USD",
    transaction_type: "income",
  },
  {
    name: "Galicia Mastercard - Resumen ARS",
    sender_email: "e-resumen@bancogalicia.com.ar",
    subject_pattern: "Resumen.*Tarjeta.*MasterCard|MasterCard",
    amount_regex: "Total en pesos[:\\s]*([\\d.,]+)",
    currency: "ARS",
    transaction_type: "expense",
    date_regex: "Vencimiento[:\\s]*([\\d]{1,2}\\s+[A-Za-z]{3}\\s+\\d{2,4})",
  },
  {
    name: "Galicia Mastercard - Resumen USD",
    sender_email: "e-resumen@bancogalicia.com.ar",
    subject_pattern: "Resumen.*Tarjeta.*MasterCard|MasterCard",
    amount_regex: "Total en d[óo]lares[:\\s]*([\\d.,]+)",
    currency: "USD",
    transaction_type: "expense",
    date_regex: "Vencimiento[:\\s]*([\\d]{1,2}\\s+[A-Za-z]{3}\\s+\\d{2,4})",
  },
  {
    name: "Galicia VISA - Resumen ARS",
    sender_email: "e-resumen@mensajesgalicia.com.ar",
    subject_pattern: "Resumen.*VISA|Cuenta VISA",
    amount_regex: "Saldo en pesos[:\\s]*([\\d.,]+)",
    currency: "ARS",
    transaction_type: "expense",
    date_regex: "Vencimiento[:\\s]*([\\d]{1,2}\\s+[A-Za-z]{3}\\s+\\d{2,4})",
  },
  {
    name: "Galicia VISA - Resumen USD",
    sender_email: "e-resumen@mensajesgalicia.com.ar",
    subject_pattern: "Resumen.*VISA|Cuenta VISA",
    amount_regex: "Saldo en d[óo]lares[:\\s]*([\\d.,]+)",
    currency: "USD",
    transaction_type: "expense",
    date_regex: "Vencimiento[:\\s]*([\\d]{1,2}\\s+[A-Za-z]{3}\\s+\\d{2,4})",
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connections, setConnections] = useState<GmailConnection[]>([]);
  const [parsers, setParsers] = useState<EmailParser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showParserForm, setShowParserForm] = useState(false);
  const [editingParser, setEditingParser] = useState<EmailParser | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Credit cards hook
  const { creditCards, addCreditCard, deleteCreditCard } = useCreditCardsData(userId);
  
  // Recurring expenses hook
  const { 
    recurringExpenses, 
    addRecurringExpense, 
    updateRecurringExpense, 
    deleteRecurringExpense, 
    generateTransaction 
  } = useRecurringExpensesData(userId);
  
  // Categories hook
  const { categories: allCategories } = useCategoriesData();
  
  // Push notifications hook
  const pushNotifications = usePushNotifications(userId);
  
  // Parser form state
  const [parserForm, setParserForm] = useState({
    name: "",
    sender_email: "",
    subject_pattern: "",
    amount_regex: "",
    currency: "ARS",
    category: "",
    transaction_type: "expense",
    is_active: true,
  });

  useEffect(() => {
    // Get user ID
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
    
    fetchData();
    
    // Listen for Gmail connection messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "gmail-connected") {
        toast.success(`Gmail conectado: ${event.data.email}`);
        fetchConnections();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchConnections(), fetchParsers(), fetchCategories()]);
    setLoading(false);
  };

  const fetchConnections = async () => {
    const { data, error } = await supabase
      .from("gmail_connections")
      .select("id, email, created_at, watch_expiration")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching connections:", error);
    } else {
      setConnections(data || []);
    }
  };

  const fetchParsers = async () => {
    const { data, error } = await supabase
      .from("email_parsers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching parsers:", error);
    } else {
      setParsers(data || []);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data || []);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión primero");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-oauth?action=get-auth-url`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.authUrl) {
        // Open OAuth popup
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        window.open(
          data.authUrl,
          "gmail-oauth",
          `width=${width},height=${height},left=${left},top=${top}`
        );
      } else {
        toast.error("Error obteniendo URL de autenticación");
      }
    } catch (error) {
      console.error("Gmail connect error:", error);
      toast.error("Error conectando Gmail");
    }
  };

  const handleDisconnectGmail = async (connectionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-oauth?action=disconnect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ connectionId }),
        }
      );

      if (response.ok) {
        toast.success("Gmail desconectado");
        fetchConnections();
      } else {
        toast.error("Error desconectando Gmail");
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Error desconectando Gmail");
    }
  };

  const handleSyncEmails = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión primero");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Sincronizado: ${data.transactionsCreated} transacciones creadas`);
      } else {
        toast.error(data.error || "Error sincronizando");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Error sincronizando emails");
    } finally {
      setSyncing(false);
    }
  };

  const handleApplyTemplate = (template: typeof PARSER_TEMPLATES[0]) => {
    setParserForm({
      ...parserForm,
      name: template.name,
      sender_email: template.sender_email,
      subject_pattern: template.subject_pattern,
      amount_regex: template.amount_regex,
      currency: template.currency,
      transaction_type: template.transaction_type,
    });
    setShowParserForm(true);
  };

  const handleSaveParser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      if (!parserForm.name || !parserForm.sender_email || !parserForm.amount_regex || !parserForm.category) {
        toast.error("Completa todos los campos requeridos");
        return;
      }

      if (editingParser) {
        const { error } = await supabase
          .from("email_parsers")
          .update({
            name: parserForm.name,
            sender_email: parserForm.sender_email,
            subject_pattern: parserForm.subject_pattern || null,
            amount_regex: parserForm.amount_regex,
            currency: parserForm.currency,
            category: parserForm.category,
            transaction_type: parserForm.transaction_type,
            is_active: parserForm.is_active,
          })
          .eq("id", editingParser.id);

        if (error) throw error;
        toast.success("Parser actualizado");
      } else {
        const { error } = await supabase
          .from("email_parsers")
          .insert({
            user_id: user.id,
            name: parserForm.name,
            sender_email: parserForm.sender_email,
            subject_pattern: parserForm.subject_pattern || null,
            amount_regex: parserForm.amount_regex,
            currency: parserForm.currency,
            category: parserForm.category,
            transaction_type: parserForm.transaction_type,
            is_active: parserForm.is_active,
          });

        if (error) throw error;
        toast.success("Parser creado");
      }

      setShowParserForm(false);
      setEditingParser(null);
      resetParserForm();
      fetchParsers();
    } catch (error: any) {
      console.error("Save parser error:", error);
      toast.error(error.message || "Error guardando parser");
    }
  };

  const handleEditParser = (parser: EmailParser) => {
    setEditingParser(parser);
    setParserForm({
      name: parser.name,
      sender_email: parser.sender_email,
      subject_pattern: parser.subject_pattern || "",
      amount_regex: parser.amount_regex,
      currency: parser.currency,
      category: parser.category,
      transaction_type: parser.transaction_type,
      is_active: parser.is_active,
    });
    setShowParserForm(true);
  };

  const handleDeleteParser = async (parserId: string) => {
    try {
      const { error } = await supabase
        .from("email_parsers")
        .delete()
        .eq("id", parserId);

      if (error) throw error;
      toast.success("Parser eliminado");
      fetchParsers();
    } catch (error: any) {
      toast.error(error.message || "Error eliminando parser");
    }
  };

  const handleToggleParser = async (parser: EmailParser) => {
    try {
      const { error } = await supabase
        .from("email_parsers")
        .update({ is_active: !parser.is_active })
        .eq("id", parser.id);

      if (error) throw error;
      fetchParsers();
    } catch (error: any) {
      toast.error(error.message || "Error actualizando parser");
    }
  };

  const resetParserForm = () => {
    setParserForm({
      name: "",
      sender_email: "",
      subject_pattern: "",
      amount_regex: "",
      currency: "ARS",
      category: "",
      transaction_type: "expense",
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 md:px-6 py-4 pl-14 md:pl-6">
            <h1 className="text-xl md:text-2xl font-bold">Configuración</h1>
          </div>
        </header>
        
        <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          <Tabs defaultValue="install" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="install" className="text-sm">
                <Smartphone className="h-4 w-4 mr-1" />
                Instalar
              </TabsTrigger>
              <TabsTrigger value="recurring" className="text-sm">Recurrentes</TabsTrigger>
              <TabsTrigger value="credit-cards" className="text-sm">Tarjetas</TabsTrigger>
              <TabsTrigger value="notifications" className="text-sm">Notificaciones</TabsTrigger>
              <TabsTrigger value="gmail" className="text-sm">Gmail</TabsTrigger>
              <TabsTrigger value="parsers" className="text-sm">Parsers</TabsTrigger>
            </TabsList>

            <TabsContent value="install">
              <PWAInstallInstructions />
            </TabsContent>

          <TabsContent value="recurring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="h-5 w-5" />
                  Gastos Recurrentes
                </CardTitle>
                <CardDescription>
                  Configura gastos que se repiten cada mes. Podrás generarlos con un click y ajustar el monto si es necesario.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AddRecurringExpenseDialog 
                  categories={allCategories} 
                  onAdd={addRecurringExpense} 
                />
                <RecurringExpensesList
                  expenses={recurringExpenses}
                  categories={allCategories}
                  onDelete={deleteRecurringExpense}
                  onUpdate={updateRecurringExpense}
                  onGenerate={generateTransaction}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credit-cards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Tarjetas de Crédito
                </CardTitle>
                <CardDescription>
                  Registra tus tarjetas de crédito para hacer seguimiento de gastos proyectados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AddCreditCardDialog onAdd={addCreditCard} />
                <CreditCardsList creditCards={creditCards} onDelete={deleteCreditCard} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationSettings
              isSupported={pushNotifications.isSupported}
              isPWA={pushNotifications.isPWA}
              permission={pushNotifications.permission}
              subscriptions={pushNotifications.subscriptions}
              settings={pushNotifications.settings}
              loading={pushNotifications.loading}
              subscribing={pushNotifications.subscribing}
              onSubscribe={pushNotifications.subscribe}
              onUnsubscribe={pushNotifications.unsubscribe}
              onUpdateSettings={pushNotifications.updateSettings}
              onSendTest={pushNotifications.sendTestNotification}
            />
          </TabsContent>

          <TabsContent value="gmail" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Conexiones de Gmail
                </CardTitle>
                <CardDescription>
                  Conecta tu cuenta de Gmail para importar gastos automáticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleConnectGmail}>
                    <Plus className="h-4 w-4 mr-2" />
                    Conectar Gmail
                  </Button>
                  {connections.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleSyncEmails}
                      disabled={syncing}
                    >
                      {syncing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Sincronizar ahora
                    </Button>
                  )}
                </div>

                {connections.length > 0 ? (
                  <div className="space-y-2">
                    {connections.map((conn) => (
                      <div
                        key={conn.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{conn.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Conectado: {new Date(conn.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDisconnectGmail(conn.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No hay cuentas de Gmail conectadas
                  </p>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>URL del Webhook para Pub/Sub:</strong>
                  </p>
                  <code className="text-xs bg-muted p-2 rounded block mt-1 break-all">
                    {import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-webhook
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parsers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Parsers</CardTitle>
                <CardDescription>
                  Configura reglas para extraer gastos de emails específicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Templates */}
                <div>
                  <Label className="text-sm font-medium">Templates rápidos</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PARSER_TEMPLATES.map((template) => (
                      <Button
                        key={template.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyTemplate(template)}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Parser Form */}
                {showParserForm && (
                  <Card className="border-primary">
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre *</Label>
                          <Input
                            value={parserForm.name}
                            onChange={(e) =>
                              setParserForm({ ...parserForm, name: e.target.value })
                            }
                            placeholder="DolarApp - Transferencias"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email del remitente *</Label>
                          <Input
                            value={parserForm.sender_email}
                            onChange={(e) =>
                              setParserForm({ ...parserForm, sender_email: e.target.value })
                            }
                            placeholder="no-reply@dolarapp.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Patrón de subject (regex)</Label>
                          <Input
                            value={parserForm.subject_pattern}
                            onChange={(e) =>
                              setParserForm({ ...parserForm, subject_pattern: e.target.value })
                            }
                            placeholder="Enviaste|Transferencia"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Regex para monto *</Label>
                          <Input
                            value={parserForm.amount_regex}
                            onChange={(e) =>
                              setParserForm({ ...parserForm, amount_regex: e.target.value })
                            }
                            placeholder="([\d.,]+)\s*ARS"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Moneda</Label>
                          <Select
                            value={parserForm.currency}
                            onValueChange={(v) =>
                              setParserForm({ ...parserForm, currency: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ARS">ARS</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select
                            value={parserForm.transaction_type}
                            onValueChange={(v) =>
                              setParserForm({ ...parserForm, transaction_type: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expense">Gasto</SelectItem>
                              <SelectItem value="income">Ingreso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Categoría *</Label>
                          <Select
                            value={parserForm.category}
                            onValueChange={(v) =>
                              setParserForm({ ...parserForm, category: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories
                                .filter((c) => c.type === parserForm.transaction_type)
                                .map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={parserForm.is_active}
                          onCheckedChange={(v) =>
                            setParserForm({ ...parserForm, is_active: v })
                          }
                        />
                        <Label>Activo</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleSaveParser}>
                          {editingParser ? "Actualizar" : "Crear"} Parser
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowParserForm(false);
                            setEditingParser(null);
                            resetParserForm();
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!showParserForm && (
                  <Button onClick={() => setShowParserForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Parser
                  </Button>
                )}

                {/* Parsers List */}
                <div className="space-y-2">
                  {parsers.map((parser) => (
                    <div
                      key={parser.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{parser.name}</p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              parser.is_active
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {parser.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {parser.sender_email} • {parser.currency} • {parser.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={parser.is_active}
                          onCheckedChange={() => handleToggleParser(parser)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditParser(parser)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteParser(parser.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {parsers.length === 0 && !showParserForm && (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No hay parsers configurados. Crea uno usando los templates o manualmente.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </AppLayout>
  );
}
