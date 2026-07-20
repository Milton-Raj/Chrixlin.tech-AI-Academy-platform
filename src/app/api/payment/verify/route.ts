import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { completePaymentByOrder } from "@/lib/payments";

const schema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { orderId, paymentId, signature } = parsed.data;

  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
  }

  try {
    const payment = await completePaymentByOrder(orderId, paymentId);
    return NextResponse.json({ ok: true, registrationId: payment.registrationId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Payment completion failed" },
      { status: 400 }
    );
  }
}
