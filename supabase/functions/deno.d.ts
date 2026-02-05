/**
 * Type declarations for Supabase Edge Functions (Deno runtime).
 * The IDE uses these when the Deno extension is not installed.
 */

declare global {
  const Deno: {
    env: { get(key: string): string | undefined };
    serve(handler: (req: Request) => Promise<Response>): void;
  };
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(
    url: string,
    key: string,
    options?: { auth?: { persistSession?: boolean } }
  ): unknown;
}

export {};
