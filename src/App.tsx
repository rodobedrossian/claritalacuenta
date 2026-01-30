import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { queryPersister } from '@/lib/queryPersister';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { IOSSystemBanner } from "@/components/ui/ios-system-banner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOfflineDetection } from "@/hooks/use-offline-detection";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Transactions from "./pages/Transactions";
import PendingTransactions from "./pages/PendingTransactions";
import Settings from "./pages/Settings";
import Savings from "./pages/Savings";
import Budgets from "./pages/Budgets";
import CreditCards from "./pages/CreditCards";
import Insights from "./pages/Insights";
import Categories from "./pages/Categories";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 horas
      staleTime: 1000 * 60 * 5,    // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Habilitar persistencia
persistQueryClient({
  queryClient,
  persister: queryPersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 horas
  buster: 'v1',
});

const App = () => {
  const isMobile = useIsMobile();
  const isIOSApp = Capacitor.getPlatform() === 'ios';
  const hasSeenOnboarding = localStorage.getItem("clarita_onboarding_seen") === "true";
  
  useOfflineDetection();
  
  // For development/testing: allow forcing onboarding via URL param
  const forceOnboarding = new URLSearchParams(window.location.search).get('onboarding') === 'true';
  
  // Only show onboarding on iOS app if not seen yet, or if forced via URL
  const shouldShowOnboarding = (isIOSApp && !hasSeenOnboarding) || forceOnboarding;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <IOSSystemBanner />
        {!isMobile && (
          <>
            <Toaster />
            <Sonner />
          </>
        )}
        <BrowserRouter>
          <Routes>
            {shouldShowOnboarding ? (
              <Route path="*" element={<Onboarding />} />
            ) : (
              <>
                <Route path="/landing" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                <Route path="/pending" element={<ProtectedRoute><PendingTransactions /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/savings" element={<ProtectedRoute><Savings /></ProtectedRoute>} />
                <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
                <Route path="/credit-cards" element={<ProtectedRoute><CreditCards /></ProtectedRoute>} />
                <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
                <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
