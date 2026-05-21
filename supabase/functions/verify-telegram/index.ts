import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse body once
    let body: { user_telegram_id?: number; chat_id?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { user_telegram_id, chat_id } = body;
    console.log("Received request:", { user_telegram_id, chat_id });

    if (!BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN not set");
      return new Response(JSON.stringify({ error: "Server configuration error", verified: false }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!user_telegram_id || !chat_id) {
      return new Response(JSON.stringify({ error: "Missing parameters", verified: false }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chat_id)}&user_id=${user_telegram_id}`;
    console.log("Calling Telegram API:", apiUrl);

    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log("Telegram API response:", JSON.stringify(data));

    if (!data.ok) {
      console.error("Telegram API error:", data.description);
      return new Response(JSON.stringify({ verified: false, error: data.description, raw_response: data }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const memberStatus: string = data.result?.status || "";
    const isMember = ["member", "administrator", "creator"].includes(memberStatus);

    console.log(`Telegram verification result: user=${user_telegram_id}, chat=${chat_id}, status=${memberStatus}, verified=${isMember}`);

    return new Response(JSON.stringify({ 
      verified: isMember, 
      status: memberStatus
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});