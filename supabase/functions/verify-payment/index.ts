import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TREASURY_ADDRESS = "UQDaIY3Ay61eLDg6AdML6SS698-jkXaDAuqeiAWd6QffXezc";
const TONCENTER_BASE = "https://toncenter.com/api/v2";
const MIN_UPGRADE_TON = 1000000000n; // 1 TON
const MIN_VERIFY_TON = 500000000n;   // 0.5 TON
const TONCENTER_API_KEY = Deno.env.get("TONCENTER_API_KEY") || "";
const CACHE_TTL_MS = 6000; // 6s cache — TON blocks every ~5s, safe to reuse

interface CacheEntry {
  data: any;
  expiresAt: number;
}
const toncenterCache: CacheEntry = { data: null, expiresAt: 0 };

async function fetchToncenterTransactions(): Promise<any> {
  const now = Date.now();
  if (toncenterCache.data && now < toncenterCache.expiresAt) {
    return toncenterCache.data;
  }

  const url = `${TONCENTER_BASE}/getTransactions?address=${TREASURY_ADDRESS}&limit=30${
    TONCENTER_API_KEY ? `&api_key=${TONCENTER_API_KEY}` : ""
  }`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      toncenterCache.data = data;
      toncenterCache.expiresAt = Date.now() + CACHE_TTL_MS;
      return data;
    }
    if (resp.status === 429) {
      // Rate limited — wait and retry with backoff
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    // Non-recoverable error
    console.error("Toncenter error:", resp.status, await resp.text());
    return null;
  }

  return null;
}

function friendlyAddressToRaw(friendly: string): string {
  let normalized = friendly.replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4) normalized += "=";
  const decoded = Uint8Array.from(atob(normalized), (c) => c.charCodeAt(0));
  const workchain = decoded[1];
  const hash = Array.from(decoded.slice(2, 34))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${workchain}:${hash}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: {
      user_id: string;
      method: string;
      tx_hash?: string;
      type?: string;
      user_wallet?: string;
    };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!body.user_id || !body.method) {
      return new Response(
        JSON.stringify({ error: "user_id and method required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const rpcName =
      body.type === "verify" ? "verify_user" : "upgrade_user";

    // === STARS ===
    if (body.method === "stars") {
      let payment: { id: number } | null = null;
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase
          .from("payment_confirmations")
          .select("id")
          .eq("user_id", body.user_id)
          .eq("type", body.type || "upgrade")
          .eq("method", "stars")
          .eq("used", false)
          .limit(1)
          .maybeSingle();
        payment = data;
        if (payment) break;
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (!payment) {
        return new Response(JSON.stringify({ upgraded: false }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      await supabase
        .from("payment_confirmations")
        .update({ used: true })
        .eq("id", payment.id);

      const { data, error } = await supabase.rpc(rpcName, {
        p_user_id: body.user_id,
      });
      if (error) throw error;

      return new Response(JSON.stringify({ upgraded: data }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // === TON ===
    if (body.method === "ton") {
      if (!body.tx_hash) {
        return new Response(
          JSON.stringify({ error: "tx_hash required for TON" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      if (!body.user_wallet) {
        return new Response(
          JSON.stringify({ error: "user_wallet required for TON" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Normalize user's wallet to raw format
      const userWalletRaw = body.user_wallet.startsWith("0:")
        ? body.user_wallet
        : friendlyAddressToRaw(body.user_wallet);

      // Fetch Toncenter transactions (cached for 6s across concurrent calls)
      const tcData = await fetchToncenterTransactions();
      if (!tcData?.result || !Array.isArray(tcData.result)) {
        return new Response(JSON.stringify({ upgraded: false }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Find a matching inbound transaction
      const match = tcData.result.find((tx: any) => {
        const inMsg = tx.in_msg;
        if (!inMsg) return false;

        // Normalize Toncenter's source address to raw
        const sourceRaw = inMsg.source.startsWith("0:")
          ? inMsg.source
          : friendlyAddressToRaw(inMsg.source);

        const value = BigInt(inMsg.value || "0");
        const minAmount = body.type === "verify" ? MIN_VERIFY_TON : MIN_UPGRADE_TON;
        return sourceRaw === userWalletRaw && value >= minAmount;
      });

      if (!match) {
        return new Response(JSON.stringify({ upgraded: false }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Verified on-chain — insert with replay protection
      const { error: insertError } = await supabase
        .from("payment_confirmations")
        .insert({
          user_id: body.user_id,
          type: body.type || "upgrade",
          method: "ton",
          tx_hash: body.tx_hash,
          used: true,
        });

      if (insertError) {
        console.error("Insert error (likely duplicate):", insertError.message);
        return new Response(JSON.stringify({ upgraded: false }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data, error } = await supabase.rpc(rpcName, {
        p_user_id: body.user_id,
      });
      if (error) throw error;

      return new Response(JSON.stringify({ upgraded: data }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid method" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
