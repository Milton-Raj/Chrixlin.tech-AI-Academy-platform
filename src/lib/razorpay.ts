import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Razorpay integration.
 *
 * DEV MOCK MODE: when RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are empty, order
 * creation returns a mock order and signature verification accepts the mock
 * confirmation, so the entire enroll -> pay -> welcome-email flow can be
 * tested locally without real keys. Add real keys in .env to go live.
 */
export const isMockPayments = !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET;

let client: Razorpay | null = null;
function razorpay(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return client;
}

export async function createOrder(amountInr: number, receipt: string) {
  if (isMockPayments) {
    return {
      id: `order_mock_${crypto.randomBytes(8).toString("hex")}`,
      amount: amountInr * 100,
      currency: "INR",
      mock: true as const,
    };
  }
  const order = await razorpay().orders.create({
    amount: amountInr * 100, // paise
    currency: "INR",
    receipt,
  });
  return { id: order.id, amount: Number(order.amount), currency: order.currency, mock: false as const };
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (isMockPayments) {
    return params.orderId.startsWith("order_mock_") && params.signature === "mock_signature";
  }
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  return expected === params.signature;
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}
