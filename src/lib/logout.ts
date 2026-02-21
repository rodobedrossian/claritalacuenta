import { supabase } from "@/integrations/supabase/client";

/** Sign out. Use for logout from Settings, AppLayout, etc. */
export async function performLogout(): Promise<void> {
  await supabase.auth.signOut();
}
