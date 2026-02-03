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
        .select("workspace_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        setWorkspaceId(null);
        setIsLoading(false);
        return;
      }
      setWorkspaceId(data?.workspace_id ?? null);
      setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return { workspaceId, isLoading };
}
