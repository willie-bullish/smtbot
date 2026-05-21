import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: { telegram_id?: number; username?: string; full_name?: string; referrer_telegram_id?: number };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { telegram_id, username, full_name, referrer_telegram_id } = body;

    if (!telegram_id) {
      return new Response(JSON.stringify({ error: "telegram_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let referrerId: string | null = null;
    if (referrer_telegram_id) {
      const { data: referrer } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", referrer_telegram_id)
        .single();

      if (referrer) referrerId = referrer.id;
    }

    const finalUsername = username || `user_${telegram_id}`;

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        telegram_id,
        username: finalUsername,
        full_name: full_name || null,
        referrer_id: referrerId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        const { data: existingUser } = await supabase
          .from("users")
          .select("*")
          .eq("telegram_id", telegram_id)
          .single();

        if (existingUser) {
          return new Response(JSON.stringify({ user: existingUser }), {
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
