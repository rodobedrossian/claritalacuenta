import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Transactions from "./pages/Transactions";
import PendingTransactions from "./pages/PendingTransactions";
import Settings from "./pages/Settings";
import Savings from "./pages/Savings";
import Budgets from "./pages/Budgets";
import CreditCards from "./pages/CreditCards";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/pending" element={<PendingTransactions />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/credit-cards" element={<CreditCards />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
