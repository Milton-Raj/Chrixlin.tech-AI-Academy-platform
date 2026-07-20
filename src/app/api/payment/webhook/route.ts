import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { completePaymentByOrder } from "@/lib/payments";

/**
 * Razorpay webhook (configure `payment.captured` to POST here).
 * Safety net in case the browser closes before client-side verification —
 * completePaymentByOrder is idempotent, so double delivery is harmless.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id && payment?.id) {
      try {
        await completePaymentByOrder(payment.order_id, payment.id);
      } catch (e) {
        console.error("Webhook completion failed:", e);
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
      }
    }
  }
  return NextResponse.json({ ok: true });
}
