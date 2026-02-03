import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "Rucula <noreply@rucula.app>";
const APP_ORIGIN = "https://www.rucula.app";

function inviteHtmlBody(inviteLink: string, inviterEmail: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p>Hola,</p>
  <p><strong>${inviterEmail}</strong> te invitó a compartir su espacio de trabajo en Rucula. Vas a poder ver y agregar gastos, tarjetas y más, todo en el mismo lugar.</p>
  <p><a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #2d7a4f; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Aceptar invitación</a></p>
  <p>Si no esperabas esta invitación, podés ignorar este email. El enlace caduca en 7 días.</p>
  <p style="color: #666; font-size: 14px;">— Rucula</p>
</body>
</html>
`.trim();
}

function inviteTextBody(inviteLink: string, inviterEmail: string): string {
  return `Hola,

${inviterEmail} te invitó a compartir su espacio de trabajo en Rucula. Vas a poder ver y agregar gastos, tarjetas y más, todo en el mismo lugar.

Aceptar invitación: ${inviteLink}

Si no esperabas esta invitación, podés ignorar este email. El enlace caduca en 7 días.

— Rucula`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    let workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (email === user.email) {
      return new Response(JSON.stringify({ error: "No podés invitarte a vos mismo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    if (!workspaceId) {
      const { data: members } = await supabaseAdmin
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1);
      if (!members?.length) {
        return new Response(JSON.stringify({ error: "No pertenecés a ningún espacio" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      workspaceId = members[0].workspace_id;
    }

    const { data: member } = await supabaseAdmin
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();
    if (!member) {
      return new Response(JSON.stringify({ error: "No tenés acceso a este espacio" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pendingInvites } = await supabaseAdmin
      .from("workspace_invitations")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", email)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .limit(1);
    if (pendingInvites?.length) {
      return new Response(JSON.stringify({ error: "Ya hay una invitación pendiente para ese email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: insertError } = await supabaseAdmin.from("workspace_invitations").insert({
      workspace_id: workspaceId,
      email,
      invited_by_user_id: user.id,
      token,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return new Response(JSON.stringify({ error: "Ya hay una invitación pendiente para ese email" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("send-workspace-invite insert:", insertError);
      return new Response(JSON.stringify({ error: "No se pudo crear la invitación" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || APP_ORIGIN;
    const inviteLink = `${origin}/accept-invite?token=${encodeURIComponent(token)}`;

    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: "Te invitaron a Rucula",
        html: inviteHtmlBody(inviteLink, user.email ?? "Alguien"),
        text: inviteTextBody(inviteLink, user.email ?? "Alguien"),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("send-workspace-invite Resend:", res.status, errText);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-workspace-invite:", err);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
