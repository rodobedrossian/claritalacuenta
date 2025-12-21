import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader && action !== "callback") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Action: Get OAuth URL
    if (action === "get-auth-url") {
      const { data: { user }, error: userError } = await supabase.auth.getUser(
        authHeader!.replace("Bearer ", "")
      );
      
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const redirectUri = `${SUPABASE_URL}/functions/v1/gmail-oauth?action=callback`;
      const scope = encodeURIComponent(
        "https://www.googleapis.com/auth/gmail.readonly " +
        "https://www.googleapis.com/auth/userinfo.email " +
        "openid"
      );
      const state = encodeURIComponent(JSON.stringify({ userId: user.id }));
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${scope}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${state}`;

      console.log("Generated OAuth URL for user:", user.id);
      
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: OAuth Callback
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        console.error("OAuth error:", error);
        return new Response(`<html><body><script>window.close();</script>Error: ${error}</body></html>`, {
          headers: { "Content-Type": "text/html" },
        });
      }

      if (!code || !stateParam) {
        return new Response("Missing code or state", { status: 400 });
      }

      const state = JSON.parse(decodeURIComponent(stateParam));
      const userId = state.userId;

      console.log("Processing OAuth callback for user:", userId);

      // Exchange code for tokens
      const redirectUri = `${SUPABASE_URL}/functions/v1/gmail-oauth?action=callback`;
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (tokens.error) {
        console.error("Token exchange error:", tokens);
        return new Response(`<html><body><script>window.close();</script>Token error: ${tokens.error}</body></html>`, {
          headers: { "Content-Type": "text/html" },
        });
      }

      console.log("Tokens obtained successfully");

      // Get user email from Gmail API
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      );
      const userInfo = await userInfoResponse.json();
      const email = userInfo.email;

      console.log("Gmail email:", email);

      if (!email) {
        console.error("Could not retrieve email from Google userinfo");
        return new Response(
          `<html><body><script>window.close();</script>Error: Could not retrieve email from Google. Please try again.</body></html>`,
          { headers: { "Content-Type": "text/html" } }
        );
      }

      // Calculate token expiration
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      // Store connection in database
      const { error: dbError } = await supabase
        .from("gmail_connections")
        .upsert({
          user_id: userId,
          email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt.toISOString(),
        }, {
          onConflict: "user_id,email",
        });

      if (dbError) {
        console.error("Database error:", dbError);
        return new Response(`<html><body><script>window.close();</script>Database error</body></html>`, {
          headers: { "Content-Type": "text/html" },
        });
      }

      console.log("Gmail connection saved successfully");

      // Setup Gmail watch (Pub/Sub)
      try {
        console.log("Setting up Gmail watch...");
        const watchResponse = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/watch",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              topicName: "projects/lector-emails/topics/gmail-notify-topic",
              labelIds: ["INBOX"],
            }),
          }
        );

        const watchData = await watchResponse.json();
        console.log("Watch setup response status:", watchResponse.status);
        console.log("Watch setup response data:", JSON.stringify(watchData));

        if (watchResponse.ok && watchData.historyId) {
          console.log("Watch created successfully! historyId:", watchData.historyId, "expiration:", watchData.expiration);
          await supabase
            .from("gmail_connections")
            .update({
              history_id: watchData.historyId,
              watch_expiration: new Date(parseInt(watchData.expiration)).toISOString(),
            })
            .eq("user_id", userId)
            .eq("email", email);
          console.log("Watch info saved to database");
        } else {
          console.error("Watch setup failed! Status:", watchResponse.status, "Error:", JSON.stringify(watchData));
        }
      } catch (watchError) {
        console.error("Watch setup exception:", watchError);
      }

      return new Response(
        `<html>
          <body>
            <script>
              window.opener?.postMessage({ type: 'gmail-connected', email: '${email}' }, '*');
              window.close();
            </script>
            <p>Connected successfully! You can close this window.</p>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Action: Disconnect
    if (action === "disconnect") {
      const { data: { user }, error: userError } = await supabase.auth.getUser(
        authHeader!.replace("Bearer ", "")
      );
      
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { connectionId } = await req.json();

      const { error: deleteError } = await supabase
        .from("gmail_connections")
        .delete()
        .eq("id", connectionId)
        .eq("user_id", user.id);

      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Gmail connection deleted:", connectionId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Gmail OAuth error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
