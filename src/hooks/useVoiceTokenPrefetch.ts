import { useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CachedToken {
  token: string;
  expiresAt: number;
}

// Token expires in 15 minutes, but we refresh 1 minute early for safety
const TOKEN_LIFETIME_MS = 14 * 60 * 1000; // 14 minutes

export const useVoiceTokenPrefetch = () => {
  const cachedTokenRef = useRef<CachedToken | null>(null);
  const isFetchingRef = useRef(false);

  const fetchToken = useCallback(async (): Promise<string | null> => {
    // If already fetching, wait and return null (caller should retry)
    if (isFetchingRef.current) {
      console.log("[TokenPrefetch] Already fetching, skipping...");
      return null;
    }

    isFetchingRef.current = true;
    console.log("[TokenPrefetch] Fetching new token...");

    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-scribe-token');
      
      if (error) {
        console.error("[TokenPrefetch] Error fetching token:", error);
        return null;
      }

      if (!data?.token) {
        console.error("[TokenPrefetch] No token in response");
        return null;
      }

      cachedTokenRef.current = {
        token: data.token,
        expiresAt: Date.now() + TOKEN_LIFETIME_MS
      };

      console.log("[TokenPrefetch] Token cached, expires in 14 minutes");
      return data.token;
    } catch (err) {
      console.error("[TokenPrefetch] Exception:", err);
      return null;
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    // Check if we have a valid cached token
    if (cachedTokenRef.current) {
      const { token, expiresAt } = cachedTokenRef.current;
      
      if (Date.now() < expiresAt) {
        console.log("[TokenPrefetch] Using cached token");
        // Clear the cache so next call fetches fresh (single-use tokens)
        cachedTokenRef.current = null;
        return token;
      } else {
        console.log("[TokenPrefetch] Cached token expired");
        cachedTokenRef.current = null;
      }
    }

    // No valid cache, fetch new token
    return fetchToken();
  }, [fetchToken]);

  const prefetch = useCallback(() => {
    // Only prefetch if no valid token exists
    if (cachedTokenRef.current && Date.now() < cachedTokenRef.current.expiresAt) {
      console.log("[TokenPrefetch] Token already cached, skipping prefetch");
      return;
    }
    
    // Fire and forget
    fetchToken();
  }, [fetchToken]);

  // Prefetch on mount
  useEffect(() => {
    prefetch();
  }, [prefetch]);

  return {
    getToken,
    prefetch,
    hasValidToken: () => {
      return cachedTokenRef.current !== null && Date.now() < cachedTokenRef.current.expiresAt;
    }
  };
};
