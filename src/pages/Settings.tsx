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
import { SettingsSkeleton } from "@/components/skeletons/DashboardSkeleton";
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
          {/* ... (rest of the Tabs and content) ... */}
        </main>
        
        {/* Spacer to clear bottom nav */}
        <div className="h-[calc(72px+env(safe-area-inset-bottom,0)+2rem)] md:hidden" />
      </div>
    </AppLayout>
  );
}
