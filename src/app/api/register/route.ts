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
 * Registration step: upserts the student, creates/reuses a pending
 * registration for the chosen batch, creates a Razorpay order (or a mock
 * order in dev) and returns everything the client needs to open checkout.
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

  const student = await prisma.student.upsert({
    where: { email },
    update: { name, phone, country, profession, experience },
    create: { name, email, phone, country, profession, experience },
  });

  // Reuse an existing registration for this batch (e.g. retry after failed payment)
  let registration = await prisma.registration.findUnique({
    where: { studentId_batchId: { studentId: student.id, batchId } },
  });
  if (registration?.paymentStatus === "PAID") {
    return NextResponse.json({ error: "You are already enrolled in this batch" }, { status: 400 });
  }
  if (!registration) {
    registration = await prisma.registration.create({
      data: { studentId: student.id, batchId },
    });
  }

  const course = batch.course;
  const offerActive =
    course.offerPrice < course.price &&
    (!course.offerEndDate || course.offerEndDate > new Date());
  const amount = offerActive ? course.offerPrice : course.price;

  const order = await createOrder(amount, registration.id);

  await prisma.payment.create({
    data: {
      registrationId: registration.id,
      amount,
      orderId: order.id,
      status: "CREATED",
    },
  });

  return NextResponse.json({
    registrationId: registration.id,
    order: { id: order.id, amount: order.amount, currency: order.currency },
    mock: isMockPayments,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
    student: { name: student.name, email: student.email, phone: student.phone },
  });
}
