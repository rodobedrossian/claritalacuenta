import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface ReconciliationAlert {
  id: string;
  user_id: string;
  user_email: string | null;
  file_name: string;
  statement_month: string;
  created_at: string;
  conciliacion: {
    estado_ars: string;
    estado_usd: string;
    total_calculado_ars: number;
    total_resumen_ars: number;
    diferencia_ars: number;
    total_calculado_usd: number;
    total_resumen_usd: number;
    diferencia_usd: number;
    total_consumos_ars: number;
    total_impuestos_ars: number;
    total_ajustes_ars: number;
    total_consumos_usd: number;
    total_impuestos_usd: number;
    total_ajustes_usd: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseUser.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const appMetadata = claimsData.claims.app_metadata as Record<string, unknown> | undefined;
    if (appMetadata?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Fetch completed statement imports (recent first, limit 100)
    const { data: imports, error: fetchError } = await supabaseAdmin
      .from("statement_imports")
      .select("id, user_id, file_name, statement_month, created_at, extracted_data")
      .eq("status", "completed")
      .not("extracted_data", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);

    if (fetchError) {
      console.error("Error fetching statement imports:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter for those with reconciliation differences (Diferencia in estado_ars or estado_usd)
    const alerts: ReconciliationAlert[] = [];
    const userEmailCache: Record<string, string | null> = {};
    const conciliacion = (extracted: unknown) =>
      extracted && typeof extracted === "object" && "conciliacion" in extracted
        ? (extracted as { conciliacion: unknown }).conciliacion
        : null;

    for (const row of imports || []) {
      const conc = conciliacion(row.extracted_data);
      if (!conc || typeof conc !== "object") continue;

      const c = conc as Record<string, unknown>;
      const estado_ars = String(c.estado_ars ?? "");
      const estado_usd = String(c.estado_usd ?? "");

      if (!estado_ars.includes("Diferencia") && !estado_usd.includes("Diferencia")) {
        continue;
      }

      // Get user email (cached)
      let user_email = userEmailCache[row.user_id];
      if (user_email === undefined) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
        user_email = userData?.user?.email ?? null;
        userEmailCache[row.user_id] = user_email;
      }

      alerts.push({
        id: row.id,
        user_id: row.user_id,
        user_email,
        file_name: row.file_name,
        statement_month: row.statement_month,
        created_at: row.created_at,
        conciliacion: {
          estado_ars,
          estado_usd,
          total_calculado_ars: Number(c.total_calculado_ars ?? 0),
          total_resumen_ars: Number(c.total_resumen_ars ?? 0),
          diferencia_ars: Number(c.diferencia_ars ?? 0),
          total_calculado_usd: Number(c.total_calculado_usd ?? 0),
          total_resumen_usd: Number(c.total_resumen_usd ?? 0),
          diferencia_usd: Number(c.diferencia_usd ?? 0),
          total_consumos_ars: Number(c.total_consumos_ars ?? 0),
          total_impuestos_ars: Number(c.total_impuestos_ars ?? 0),
          total_ajustes_ars: Number(c.total_ajustes_ars ?? 0),
          total_consumos_usd: Number(c.total_consumos_usd ?? 0),
          total_impuestos_usd: Number(c.total_impuestos_usd ?? 0),
          total_ajustes_usd: Number(c.total_ajustes_usd ?? 0),
        },
      });
    }

    return new Response(
      JSON.stringify({ alerts }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
