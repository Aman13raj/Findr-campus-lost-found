
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

webpush.setVapidDetails(
  "amansingh.codes05@gmail.com.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

Deno.serve(async (req) => {
  const expectedSecret = Deno.env.get("PUSH_WEBHOOK_SECRET");

  if (
    req.method !== "POST" ||
    !expectedSecret ||
    req.headers.get("x-findr-webhook-secret") !== expectedSecret
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = await req.json();
    const item = payload.record;

    if (
      payload.table !== "items" ||
      payload.type !== "INSERT" ||
      !item
    ) {
      return Response.json({ skipped: true });
    }

    const itemName = String(item.name || "a new item").slice(0, 120);

    const notification = JSON.stringify({
      title: "New item reported on Findr",
      body: `Check out ${itemName} on Findr.`,
      url: "./",
    });

    const { data: rows, error } = await supabase
      .from("push_subscriptions")
      .select("id, subscription");

    if (error) throw error;

    let sent = 0;
    let failed = 0;

    for (const row of rows ?? []) {
      try {
        await webpush.sendNotification(
          row.subscription,
          notification,
        );
        sent++;
      } catch (error) {
        failed++;

        const statusCode =
          (error as { statusCode?: number }).statusCode;

        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", row.id);
        } else {
          console.error("Push delivery failed:", statusCode);
        }
      }
    }

    return Response.json({ sent, failed });
  } catch (error) {
    console.error("push-send error:", error);
    return Response.json(
      { error: "Push send failed" },
      { status: 500 },
    );
  }
});
