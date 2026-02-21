import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { queryPersister } from '@/lib/queryPersister';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { IOSSystemBanner } from "@/components/ui/ios-system-banner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOfflineDetection } from "@/hooks/use-offline-detection";
import { isAdminSubdomain } from "@/lib/adminSubdomain";
import { ADMIN_SUBDOMAIN_HOST } from "@/lib/adminSubdomain";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedLayout from "@/components/ProtectedLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import LandingApple from "./pages/LandingApple";
import LandingGenZ from "./pages/LandingGenZ";
import AdminAuth from "./pages/admin/AdminAuth";
import AdminDashboard from "./pages/admin/AdminDashboard";
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
import ResetPassword from "./pages/ResetPassword";
import AcceptInvite from "./pages/AcceptInvite";

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

  // Quitar splash estático del HTML tras el primer paint (evita pantalla blanca al abrir)
  useEffect(() => {
    const hide = () => {
      const el = document.getElementById("initial-splash");
      if (el) el.style.display = "none";
    };
    requestAnimationFrame(() => requestAnimationFrame(hide));
  }, []);

  useOfflineDetection();
  
  // For development/testing: allow forcing onboarding via URL param
  const forceOnboarding = new URLSearchParams(window.location.search).get('onboarding') === 'true';
  
  // Only show onboarding on iOS app if not seen yet, or if forced via URL
  const shouldShowOnboarding = (isIOSApp && !hasSeenOnboarding) || forceOnboarding;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <IOSSystemBanner />
          <Sonner />
          {!isMobile && <Toaster />}
          <BrowserRouter>
            <ErrorBoundary>
              <AppRoutes
                shouldShowOnboarding={shouldShowOnboarding}
                isIOSApp={isIOSApp}
              />
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

/** Redirect desktop /admin on main domain to admin.rucula.app; render admin or main routes. */
function AppRoutes({
  shouldShowOnboarding,
  isIOSApp,
}: {
  shouldShowOnboarding: boolean;
  isIOSApp: boolean;
}) {
  const { pathname } = useLocation();
  const adminSubdomain = isAdminSubdomain();

  // Desktop only: redirect rucula.app/admin → admin.rucula.app (does not affect iOS app)
  useEffect(() => {
    if (isIOSApp) return;
    const host = window.location.hostname;
    const isMainDomain = host === "rucula.app" || host === "www.rucula.app";
    if (!isMainDomain) return;
    if (pathname !== "/admin" && !pathname.startsWith("/admin/")) return;

    const targetPath = pathname === "/admin" ? "/" : pathname.replace(/^\/admin/, "");
    window.location.replace(`https://${ADMIN_SUBDOMAIN_HOST}${targetPath}`);
  }, [pathname, isIOSApp]);

  if (shouldShowOnboarding) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  // Admin subdomain: only admin routes at / and /dashboard
  if (adminSubdomain) {
    return (
      <Routes>
        <Route path="/" element={<AdminAuth />} />
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // Main app (including /admin and /admin/dashboard for iOS)
  return (
    <Routes>
      <Route path="/landing" element={<Landing />} />
      <Route path="/landing-apple" element={<LandingApple />} />
      <Route path="/landing-genz" element={<LandingGenZ />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={<AdminAuth />} />
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
