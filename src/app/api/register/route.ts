import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createOrder, isMockPayments } from "@/lib/razorpay";

const schema = z.object({
  batchId: z.string().min(1),
  name: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  country: z.string().min(2).max(100),
  profession: z.string().max(200).default(""),
  experience: z.string().max(200).default(""),
});

/**
 * Checkout step: records the form as a PendingEnrollment and opens a Razorpay
 * order (or a mock order in dev).
 *
 * Deliberately does NOT create the student, registration or payment records —
 * those are created by completePaymentByOrder once the payment succeeds, so
 * the student list only ever contains people who actually paid.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { batchId, name, email, phone, country, profession, experience } = parsed.data;

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { course: true },
  });
  if (!batch || batch.status !== "OPEN" || batch.startDate <= new Date()) {
    return NextResponse.json({ error: "This batch is not open for enrollment" }, { status: 400 });
  }
  if (batch.seatsFilled >= batch.capacity) {
    return NextResponse.json({ error: "This batch is full — please pick another batch" }, { status: 400 });
  }

  // Block a second purchase of a batch the student already paid for.
  const existing = await prisma.student.findUnique({
    where: { email },
    include: { registrations: { where: { batchId, paymentStatus: "PAID" } } },
  });
  if (existing && existing.registrations.length > 0) {
    return NextResponse.json({ error: "You are already enrolled in this batch" }, { status: 400 });
  }

  const course = batch.course;
  const offerActive =
    course.offerPrice < course.price &&
    (!course.offerEndDate || course.offerEndDate > new Date());
  const amount = offerActive ? course.offerPrice : course.price;

  const order = await createOrder(amount, `batch_${batchId}`);

  const pending = await prisma.pendingEnrollment.create({
    data: {
      batchId,
      name,
      email,
      phone,
      country,
      profession,
      experience,
      amount,
      orderId: order.id,
    },
  });

  return NextResponse.json({
    pendingId: pending.id,
    order: { id: order.id, amount: order.amount, currency: order.currency },
    mock: isMockPayments,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
    student: { name, email, phone },
  });
}
