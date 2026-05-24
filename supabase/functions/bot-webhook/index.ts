import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("ok", { status: 200 });

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!botToken) return new Response("no token", { status: 500 });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const update = await req.json();

    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      await fetch(
        `https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pre_checkout_query_id: query.id,
            ok: true,
          }),
        }
      );
    }

    if (update.message?.successful_payment) {
      const sp = update.message.successful_payment;
      const payload: string = sp.invoice_payload || "";
      const [prefix, ...rest] = payload.split("_");
      const userId = rest.join("_");

      if (userId && (prefix === "upgrade" || prefix === "verify")) {
        await supabase.from("payment_confirmations").insert({
          user_id: userId,
          type: prefix,
          method: "stars",
          invoice_payload: payload,
        }).maybeSingle();
      }
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("ok", { status: 200 });
  }
});
