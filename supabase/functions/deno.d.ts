/**
 * Type declarations for Supabase Edge Functions (Deno runtime).
 * The IDE uses these when the Deno extension is not installed.
 */

// Allow URL and other module imports
declare module "https://*";
declare module "jsr:*";
declare module "npm:*";

declare global {
  const Deno: {
    env: { get(key: string): string | undefined };
    serve(handler: (req: Request) => Promise<Response>): void;
  };
}

export {};
