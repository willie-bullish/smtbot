import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyTelegramInitData(initData: string, botToken: string): Promise<boolean> {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;

  const authDate = parseInt(params.get('auth_date') || '0');
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) return false;

  params.delete('hash');

  const sorted = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const encoder = new TextEncoder();

  const secretKeyBytes = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const secretKey = await crypto.subtle.sign('HMAC', secretKeyBytes, encoder.encode(botToken));

  const sigKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', sigKey, encoder.encode(sorted));

  const sigHex = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return sigHex === hash;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey || !botToken) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: { initData?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { initData } = body;

    if (!initData) {
      return new Response(JSON.stringify({ error: "initData is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const isValid = await verifyTelegramInitData(initData, botToken);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid Telegram data" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) {
      return new Response(JSON.stringify({ error: "User data not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const tgUser = JSON.parse(decodeURIComponent(userStr));
    const telegram_id = tgUser.id;
    const username = tgUser.username || `user_${telegram_id}`;
    const full_name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || null;

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegram_id)
      .maybeSingle();

    if (existingUser) {
      return new Response(JSON.stringify({ user: existingUser }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let referrerId: string | null = null;
    const startParam = params.get('start_param');
    if (startParam) {
      const referrerTelegramId = parseInt(startParam);
      if (!isNaN(referrerTelegramId)) {
        const { data: referrer } = await supabase
          .from("users")
          .select("id")
          .eq("telegram_id", referrerTelegramId)
          .single();

        if (referrer) referrerId = referrer.id;
      }
    }

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        telegram_id,
        username,
        full_name,
        referrer_id: referrerId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        const { data: raceUser } = await supabase
          .from("users")
          .select("*")
          .eq("telegram_id", telegram_id)
          .maybeSingle();

        if (raceUser) {
          return new Response(JSON.stringify({ user: raceUser }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }

      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ user: newUser }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
