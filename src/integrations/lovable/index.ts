// OAuth via Supabase (replaces @lovable.dev/cloud-auth-js for local/dev builds)

import { supabase } from "../supabase/client";

export const lovable = {
  auth: {
    signInWithOAuth: async (
      provider: "google" | "apple",
      opts?: { redirect_uri?: string }
    ) => {
      const redirectTo = opts?.redirect_uri || window.location.origin + "/";

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (data?.url) {
        window.location.href = data.url;
        return { redirected: true };
      }

      return { error: new Error("No se pudo iniciar el inicio de sesión") };
    },
  },
};
