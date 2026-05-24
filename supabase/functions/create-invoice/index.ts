import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let body: { user_id?: string; type?: string };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!body.user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const invoiceType = body.type || 'upgrade';
    const isUpgrade = invoiceType === 'upgrade';

    const tgResp = await fetch(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: isUpgrade ? "Premium Upgrade" : "Account Verification",
          description: isUpgrade
            ? "Double all task and referral rewards forever!"
            : "Verify your account to unlock all features.",
          payload: `${isUpgrade ? 'upgrade' : 'verify'}_${body.user_id}`,
          provider_token: "",
          currency: "XTR",
          prices: [{ label: isUpgrade ? "Premium" : "Verification", amount: 1 }],
        }),
      }
    );

    const tgData = await tgResp.json();
    if (!tgData.ok) {
      return new Response(JSON.stringify({ error: tgData.description }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ url: tgData.result }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
