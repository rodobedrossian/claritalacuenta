import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "Clarita <noreply@rucula.app>";
const SUBJECT = "Restablecer contraseña - Clarita la cuenta";

function htmlBody(resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p>Hola,</p>
  <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Clarita la cuenta.</p>
  <p><a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #0f766e; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Restablecer contraseña</a></p>
  <p>Si no solicitaste este cambio, podés ignorar este email. El enlace caduca en 24 horas.</p>
  <p style="color: #666; font-size: 14px;">— Clarita la cuenta</p>
</body>
</html>
`.trim();
}

function textBody(resetLink: string): string {
  return `Hola,

Recibimos una solicitud para restablecer la contraseña de tu cuenta en Clarita la cuenta.

Restablecer contraseña: ${resetLink}

Si no solicitaste este cambio, podés ignorar este email. El enlace caduca en 24 horas.

— Clarita la cuenta`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const safeSuccessResponse = () =>
    new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";
    let redirectTo = typeof body.redirectTo === "string" ? body.redirectTo.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return safeSuccessResponse();
    }

    if (!redirectTo) {
      const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "";
      redirectTo = origin ? `${origin}/reset-password` : "/reset-password";
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      console.error("send-password-reset: missing env SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or RESEND_API_KEY");
      return safeSuccessResponse();
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: linkData,
      error: linkError,
    } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirect_to: redirectTo },
    });

    if (linkError) {
      if (linkError.message?.toLowerCase().includes("rate limit")) {
        return new Response(
          JSON.stringify({ error: "rate_limit" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return safeSuccessResponse();
    }

    const actionLink =
      linkData?.properties?.action_link ??
      (linkData as { action_link?: string })?.action_link ??
      "";

    if (!actionLink) {
      return safeSuccessResponse();
    }

    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: SUBJECT,
        html: htmlBody(actionLink),
        text: textBody(actionLink),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("send-password-reset: Resend error", res.status, errText);
    }

    return safeSuccessResponse();
  } catch (err) {
    console.error("send-password-reset:", err);
    return safeSuccessResponse();
  }
});
