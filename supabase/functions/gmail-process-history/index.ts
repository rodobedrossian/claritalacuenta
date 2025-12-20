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

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      return data.access_token;
    }
    console.error("Token refresh failed:", data);
    return null;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

function extractAmount(text: string, regex: string): number | null {
  try {
    const pattern = new RegExp(regex, "i");
    const match = text.match(pattern);
    if (match && match[1]) {
      // Handle Argentine number format: 64.600 or 64,600 or 64600
      let numStr = match[1].replace(/\s/g, "");
      // If contains both . and ,, determine which is decimal
      if (numStr.includes(".") && numStr.includes(",")) {
        // 1.234,56 format (European)
        numStr = numStr.replace(/\./g, "").replace(",", ".");
      } else if (numStr.includes(",")) {
        // Could be 1,234 (thousands) or 1,23 (decimal)
        const parts = numStr.split(",");
        if (parts[1]?.length === 3) {
          // Thousands separator
          numStr = numStr.replace(/,/g, "");
        } else {
          // Decimal separator
          numStr = numStr.replace(",", ".");
        }
      } else if (numStr.includes(".")) {
        // Could be 1.234 (thousands) or 1.23 (decimal)
        const parts = numStr.split(".");
        if (parts[1]?.length === 3) {
          // Thousands separator (Argentine format)
          numStr = numStr.replace(/\./g, "");
        }
        // Otherwise it's decimal, keep as is
      }
      return parseFloat(numStr);
    }
    return null;
  } catch (error) {
    console.error("Regex error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { connectionId, historyId } = await req.json();
    console.log("Processing history for connection:", connectionId, "historyId:", historyId);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from("gmail_connections")
      .select("*")
      .eq("id", connectionId)
      .single();

    if (connError || !connection) {
      console.error("Connection not found:", connError);
      return new Response(JSON.stringify({ error: "Connection not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if token needs refresh
    let accessToken = connection.access_token;
    if (new Date(connection.token_expires_at) < new Date()) {
      console.log("Token expired, refreshing...");
      accessToken = await refreshAccessToken(connection.refresh_token);
      if (!accessToken) {
        return new Response(JSON.stringify({ error: "Token refresh failed" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Update token in database
      await supabase
        .from("gmail_connections")
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        })
        .eq("id", connectionId);
    }

    // Get user's email parsers
    const { data: parsers, error: parsersError } = await supabase
      .from("email_parsers")
      .select("*")
      .eq("user_id", connection.user_id)
      .eq("is_active", true);

    if (parsersError) {
      console.error("Parsers error:", parsersError);
    }

    console.log(`Found ${parsers?.length || 0} active parsers`);

    // Get history since last historyId
    const startHistoryId = connection.history_id || historyId;
    const historyUrl = `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${startHistoryId}&historyTypes=messageAdded`;
    
    const historyResponse = await fetch(historyUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const historyData = await historyResponse.json();
    console.log("History response:", JSON.stringify(historyData));

    if (historyData.error) {
      console.error("History API error:", historyData.error);
      // If historyId is too old, reset and get latest messages
      if (historyData.error.code === 404) {
        console.log("History too old, fetching latest messages instead");
      }
      return new Response(JSON.stringify({ error: historyData.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messageIds: string[] = [];
    if (historyData.history) {
      for (const item of historyData.history) {
        if (item.messagesAdded) {
          for (const msg of item.messagesAdded) {
            messageIds.push(msg.message.id);
          }
        }
      }
    }

    console.log(`Found ${messageIds.length} new messages`);

    let processedCount = 0;
    let transactionsCreated = 0;

    for (const messageId of messageIds) {
      // Check if already processed
      const { data: existing } = await supabase
        .from("processed_emails")
        .select("id")
        .eq("message_id", messageId)
        .single();

      if (existing) {
        console.log(`Message ${messageId} already processed`);
        continue;
      }

      // Get message details
      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
      const msgResponse = await fetch(msgUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const msgData = await msgResponse.json();

      // Extract headers
      const headers = msgData.payload?.headers || [];
      const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "";
      const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "";
      const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value;

      console.log(`Processing: From=${from}, Subject=${subject}`);

      // Get body text
      let bodyText = "";
      const payload = msgData.payload;
      
      if (payload?.body?.data) {
        bodyText = atob(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
      } else if (payload?.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === "text/plain" && part.body?.data) {
            bodyText += atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          } else if (part.mimeType === "text/html" && part.body?.data) {
            const html = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
            // Strip HTML tags for text extraction
            bodyText += html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
          }
        }
      }

      const snippet = msgData.snippet || "";
      const fullText = `${subject} ${snippet} ${bodyText}`;

      // Match against parsers
      let matchedParser = null;
      for (const parser of parsers || []) {
        // Check sender
        if (!from.toLowerCase().includes(parser.sender_email.toLowerCase())) {
          continue;
        }

        // Check subject pattern if defined
        if (parser.subject_pattern) {
          try {
            const subjectRegex = new RegExp(parser.subject_pattern, "i");
            if (!subjectRegex.test(subject)) {
              continue;
            }
          } catch {
            console.error("Invalid subject pattern:", parser.subject_pattern);
            continue;
          }
        }

        matchedParser = parser;
        break;
      }

      // Record processed email
      const processedEmail: any = {
        user_id: connection.user_id,
        gmail_connection_id: connectionId,
        message_id: messageId,
        raw_subject: subject.substring(0, 500),
        raw_snippet: snippet.substring(0, 500),
        status: matchedParser ? "matched" : "no_match",
      };

      if (matchedParser) {
        console.log(`Matched parser: ${matchedParser.name}`);
        
        // Extract amount
        const amount = extractAmount(fullText, matchedParser.amount_regex);
        console.log(`Extracted amount: ${amount}`);

        if (amount && amount > 0) {
          // Parse date from email or use current
          let transactionDate = new Date();
          if (dateHeader) {
            try {
              transactionDate = new Date(dateHeader);
            } catch {
              // Use current date
            }
          }

          // Create transaction with pending status
          const { data: transaction, error: txError } = await supabase
            .from("transactions")
            .insert({
              user_id: connection.user_id,
              amount,
              currency: matchedParser.currency,
              type: matchedParser.transaction_type,
              category: matchedParser.category,
              description: `${matchedParser.name}: ${subject.substring(0, 100)}`,
              date: transactionDate.toISOString(),
              source: "email",
              email_message_id: messageId,
              status: "pending",
            })
            .select()
            .single();

          if (txError) {
            console.error("Transaction creation error:", txError);
            processedEmail.status = "error";
          } else {
            processedEmail.transaction_id = transaction.id;
            processedEmail.status = "processed";
            transactionsCreated++;
            console.log("Transaction created:", transaction.id);
          }
        } else {
          processedEmail.status = "no_amount";
        }
      }

      await supabase.from("processed_emails").insert(processedEmail);
      processedCount++;
    }

    // Update historyId
    if (historyData.historyId) {
      await supabase
        .from("gmail_connections")
        .update({ history_id: historyData.historyId })
        .eq("id", connectionId);
    }

    console.log(`Processed ${processedCount} emails, created ${transactionsCreated} transactions`);

    return new Response(
      JSON.stringify({
        processed: processedCount,
        transactionsCreated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process history error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
