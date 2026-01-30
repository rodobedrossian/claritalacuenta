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
import ProtectedLayout from "@/components/ProtectedLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import LandingApple from "./pages/LandingApple";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import Savings from "./pages/Savings";
import Budgets from "./pages/Budgets";
import CreditCards from "./pages/CreditCards";
import Insights from "./pages/Insights";
import Categories from "./pages/Categories";
import Recurrentes from "./pages/Recurrentes";
import Mas from "./pages/Mas";
import Legales from "./pages/Legales";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Privacy from "./pages/Privacy";

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
                <Route path="/landing-apple" element={<LandingApple />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/auth" element={<Auth />} />
                <Route element={<ProtectedLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/savings" element={<Savings />} />
                  <Route path="/budgets" element={<Budgets />} />
                  <Route path="/credit-cards" element={<CreditCards />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/recurrentes" element={<Recurrentes />} />
                  <Route path="/mas" element={<Mas />} />
                  <Route path="/legales" element={<Legales />} />
                </Route>
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
