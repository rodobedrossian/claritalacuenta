import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AccountAge {
  hasMinimumUsage: boolean;
  daysRemaining: number;
}

const MINIMUM_DAYS = 60;

export function useAccountAge(): AccountAge {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user?.created_at) {
      return { hasMinimumUsage: false, daysRemaining: MINIMUM_DAYS };
    }

    const createdAt = new Date(user.created_at);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return {
      hasMinimumUsage: diffDays >= MINIMUM_DAYS,
      daysRemaining: Math.max(0, MINIMUM_DAYS - diffDays),
    };
  }, [user?.created_at]);
}
