import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  console.log("Gmail webhook received");

  try {
    const body = await req.json();
    console.log("Webhook body:", JSON.stringify(body));

    // Decode Pub/Sub message
    const message = body.message;
    if (!message?.data) {
      console.log("No message data");
      return new Response("OK", { status: 200 });
    }

    const decodedData = atob(message.data);
    const notification = JSON.parse(decodedData);
    console.log("Notification data:", notification);

    const { emailAddress, historyId } = notification;

    if (!emailAddress || !historyId) {
      console.log("Missing emailAddress or historyId");
      return new Response("OK", { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find the Gmail connection for this email
    const { data: connections, error: connError } = await supabase
      .from("gmail_connections")
      .select("*")
      .eq("email", emailAddress);

    if (connError || !connections?.length) {
      console.log("No connection found for:", emailAddress);
      return new Response("OK", { status: 200 });
    }

    console.log(`Found ${connections.length} connection(s) for ${emailAddress}`);

    // Process each connection
    for (const connection of connections) {
      try {
        // Call the process-history function
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/gmail-process-history`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              connectionId: connection.id,
              historyId,
            }),
          }
        );

        const result = await response.text();
        console.log(`Process history result for ${connection.id}:`, result);
      } catch (processError) {
        console.error(`Error processing connection ${connection.id}:`, processError);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to acknowledge the message
    return new Response("OK", { status: 200 });
  }
});
