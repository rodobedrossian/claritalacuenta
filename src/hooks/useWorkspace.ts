import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the current user's primary workspace id (first workspace they belong to).
 * Used for scoping all shared data (transactions, cards, budgets, etc.).
 */
export function useWorkspace(userId: string | null): {
  workspaceId: string | null;
  isLoading: boolean;
} {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setWorkspaceId(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", userId);

      if (!mounted) return;
      if (error || !data?.length) {
        setWorkspaceId(null);
        setIsLoading(false);
        return;
      }
      // Prefer a workspace where user is "member" (shared) over "owner" (solo)
      const shared = data.find((r) => r.role === "member");
      setWorkspaceId(shared?.workspace_id ?? data[0].workspace_id);
      setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return { workspaceId, isLoading };
}
