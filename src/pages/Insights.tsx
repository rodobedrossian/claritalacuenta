import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { InsightsSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useInsightsData } from "@/hooks/useInsightsData";
import { supabase } from "@/integrations/supabase/client";

const Insights = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUserId(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data, loading: insightsLoading, refetch } = useInsightsData(userId);

  if (loading) {
    return (
      <AppLayout>
        <InsightsSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <InsightsPanel
          insights={data?.insights || []}
          loading={insightsLoading}
          metadata={data?.metadata || null}
          onRefresh={refetch}
        />
      </div>
    </AppLayout>
  );
};

export default Insights;
