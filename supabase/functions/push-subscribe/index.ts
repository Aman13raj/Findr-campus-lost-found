
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const origin = req.headers.get("origin");

  if (req.method !== "POST" || !allowedOrigin || origin !== allowedOrigin) {
    return new Response("Forbidden", {
      status: 403,
      headers: corsHeaders,
    });
  }

  try {
    const subscription = await req.json();

    if (
      typeof subscription.endpoint !== "string" ||
      !subscription.endpoint.startsWith("https://") ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      return Response.json(
        { error: "Invalid subscription" },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: subscription.endpoint,
          subscription,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );

    if (error) throw error;

    return Response.json(
      { success: true },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("push-subscribe error:", error);

    return Response.json(
      { error: "Could not save subscription" },
      { status: 500, headers: corsHeaders },
    );
  }
});
