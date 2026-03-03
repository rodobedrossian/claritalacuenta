import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: authUser } = await adminClient.auth.admin.getUserById(user.id);
    if (authUser?.user?.app_metadata?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const startDate = url.searchParams.get("start_date") ||
      new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const endDate = url.searchParams.get("end_date") || new Date().toISOString().split("T")[0];
    const deviceType = url.searchParams.get("device_type") || "all";
    const os = url.searchParams.get("os") || "all";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("user_events")
      .select("id, user_id, event_type, event_name, properties, path, created_at")
      .gte("created_at", `${startDate}T00:00:00Z`)
      .lte("created_at", `${endDate}T23:59:59Z`)
      .order("created_at", { ascending: true })
      .limit(50000);

    const { data: events, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    const list = events || [];

    // Filter by device_type and os in memory (Supabase jsonb filter can be tricky)
    let filtered = list;
    if (deviceType !== "all") {
      filtered = filtered.filter((e) => (e.properties as Record<string, string>)?.device_type === deviceType);
    }
    if (os !== "all") {
      filtered = filtered.filter((e) => (e.properties as Record<string, string>)?.os === os);
    }

    // Aggregate by event_type
    const byEventType: Record<string, number> = {};
    for (const e of filtered) {
      byEventType[e.event_type] = (byEventType[e.event_type] || 0) + 1;
    }

    // Aggregate by event_name (top 15)
    const byEventName: Record<string, number> = {};
    for (const e of filtered) {
      byEventName[e.event_name] = (byEventName[e.event_name] || 0) + 1;
    }
    const topEventNames = Object.entries(byEventName)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));

    // Top clicks (event_type = click) - aggregate by event_name + label + path
    const clicks = filtered.filter((e) => e.event_type === "click");
    const byClickKey: Record<string, { count: number; label: string; path: string; event_name: string }> = {};
    for (const e of clicks) {
      const props = e.properties as Record<string, string> | null;
      const label = props?.label || e.event_name;
      const path = e.path || "(unknown)";
      const key = `${e.event_name}::${label}::${path}`;
      if (!byClickKey[key]) {
        byClickKey[key] = { count: 0, label, path, event_name: e.event_name };
      }
      byClickKey[key].count += 1;
    }
    const topClickTargets = Object.values(byClickKey)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map(({ event_name, label, path, count }) => ({
        event_name,
        label,
        path,
        count,
        display: `${label} (${path})`,
      }));

    // Top paths by clicks
    const byPathClicks: Record<string, number> = {};
    for (const e of clicks) {
      const p = e.path || "(unknown)";
      byPathClicks[p] = (byPathClicks[p] || 0) + 1;
    }
    const topPathsByClicks = Object.entries(byPathClicks)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([path, count]) => ({ path, count }));

    // Time by path (from navigation events)
    const navEvents = filtered.filter(
      (e) => e.event_type === "navigation" && e.event_name === "page_view"
    );

    const timeByPath: Record<string, { total_seconds: number; sessions: number }> = {};
    const userLastNav: Record<string, { path: string; ts: number }> = {};

    for (const e of navEvents) {
      const props = e.properties as Record<string, string>;
      const toPath = props?.to || e.path || "/";
      const ts = new Date(e.created_at).getTime();
      const uid = e.user_id || "anon";

      if (userLastNav[uid]) {
        const prev = userLastNav[uid];
        const durationSec = Math.max(0, Math.min((ts - prev.ts) / 1000, 3600));
        if (!timeByPath[prev.path]) {
          timeByPath[prev.path] = { total_seconds: 0, sessions: 0 };
        }
        timeByPath[prev.path].total_seconds += durationSec;
        timeByPath[prev.path].sessions += 1;
      }

      userLastNav[uid] = { path: toPath, ts };
    }

    const timeByPathList = Object.entries(timeByPath)
      .map(([path, data]) => ({ path, ...data }))
      .sort((a, b) => b.total_seconds - a.total_seconds)
      .slice(0, 15);

    // Distribution by device_type
    const byDeviceType: Record<string, number> = {};
    for (const e of filtered) {
      const dt = (e.properties as Record<string, string>)?.device_type || "unknown";
      byDeviceType[dt] = (byDeviceType[dt] || 0) + 1;
    }

    // Distribution by os
    const byOs: Record<string, number> = {};
    for (const e of filtered) {
      const o = (e.properties as Record<string, string>)?.os || "unknown";
      byOs[o] = (byOs[o] || 0) + 1;
    }

    // Top users by event count
    const byUserId: Record<string, number> = {};
    for (const e of filtered) {
      const uid = e.user_id || "anon";
      byUserId[uid] = (byUserId[uid] || 0) + 1;
    }
    const topUserIds = Object.entries(byUserId)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .filter(([uid]) => uid !== "anon");

    const topUsersByEvents: { user_id: string; email: string; count: number }[] = [];
    for (const [uid, count] of topUserIds) {
      const { data: u } = await adminClient.auth.admin.getUserById(uid);
      topUsersByEvents.push({
        user_id: uid,
        email: u?.user?.email || uid,
        count,
      });
    }

    return new Response(
      JSON.stringify({
        filters: { start_date: startDate, end_date: endDate, device_type: deviceType, os },
        total_events: filtered.length,
        by_event_type: Object.entries(byEventType).map(([name, count]) => ({ name, count })),
        top_event_names: topEventNames,
        top_click_targets: topClickTargets,
        top_paths_by_clicks: topPathsByClicks,
        time_by_path: timeByPathList,
        by_device_type: Object.entries(byDeviceType).map(([name, count]) => ({ name, count })),
        by_os: Object.entries(byOs).map(([name, count]) => ({ name, count })),
        top_users_by_events: topUsersByEvents,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[get-event-analytics] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
