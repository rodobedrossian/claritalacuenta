import { useEffect, useRef } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { initPushNotifications } from "@/lib/pushNotifications";
import { InviteDrawerProvider } from "@/contexts/InviteDrawerContext";
import { InviteToWorkspaceDrawer } from "@/components/workspace/InviteToWorkspaceDrawer";

/**
 * Layout that wraps all protected routes. If no session, redirects to /auth.
 */
const ProtectedLayout = () => {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const pushInited = useRef(false);

  useEffect(() => {
    if (!authLoading && !session) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (!session || pushInited.current) return;
    pushInited.current = true;
    initPushNotifications(supabase).catch((err) => console.warn("[Push] Init failed:", err));
  }, [session]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <InviteDrawerProvider>
        <Outlet />
        <InviteToWorkspaceDrawer />
      </InviteDrawerProvider>
    );
  }

  return null;
};

export default ProtectedLayout;
