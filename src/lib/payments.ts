import { prisma } from "@/lib/db";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { syncBatches } from "@/lib/batches";

/**
 * Turns a successful payment into a real enrollment.
 *
 * Nothing about the student is written to the Student/Registration/Payment
 * tables until the money actually arrives — the checkout form is parked in
 * PendingEnrollment until then. This keeps the student list free of unpaid
 * signups while still recording every checkout attempt.
 *
 * Idempotent: the browser verify call and the Razorpay webhook can both land
 * for the same order, and only the first one creates records.
 */
export async function completePaymentByOrder(
  orderId: string,
  transactionId: string,
  extra: { signature?: string; method?: string } = {}
) {
  // Already processed? Return the existing payment.
  const existing = await prisma.payment.findFirst({
    where: { orderId, status: "PAID" },
  });
  if (existing) return existing;

  const pending = await prisma.pendingEnrollment.findUnique({ where: { orderId } });
  if (!pending) throw new Error("No checkout found for order " + orderId);

  const batch = await prisma.batch.findUnique({
    where: { id: pending.batchId },
    include: { course: true, meeting: true },
  });
  if (!batch) throw new Error("Batch no longer exists");

  // The money is already taken at this point, so a full batch must not lose the
  // enrollment — record it and let the admin sort out capacity.
  const overCapacity = batch.seatsFilled >= batch.capacity;

  const student = await prisma.student.upsert({
    where: { email: pending.email },
    update: {
      name: pending.name,
      phone: pending.phone,
      country: pending.country,
      profession: pending.profession,
      experience: pending.experience,
    },
    create: {
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      country: pending.country,
      profession: pending.profession,
      experience: pending.experience,
    },
  });

  const registration = await prisma.registration.upsert({
    where: { studentId_batchId: { studentId: student.id, batchId: batch.id } },
    update: { status: "PAID", paymentStatus: "PAID" },
    create: {
      studentId: student.id,
      batchId: batch.id,
      status: "PAID",
      paymentStatus: "PAID",
      source: "WEBSITE",
      notes: overCapacity ? "Paid while batch was at capacity — please review." : "",
    },
  });

  const payment = await prisma.payment.create({
    data: {
      registrationId: registration.id,
      amount: pending.amount,
      provider: "RAZORPAY",
      method: extra.method ?? "",
      orderId,
      transactionId,
      signature: extra.signature,
      status: "PAID",
      paymentDate: new Date(),
    },
  });

  await prisma.$transaction([
    prisma.batch.update({
      where: { id: batch.id },
      data: { seatsFilled: { increment: 1 } },
    }),
    prisma.pendingEnrollment.update({
      where: { id: pending.id },
      data: { status: "COMPLETED" },
    }),
  ]);

  // Email 1 — welcome, receipt, batch details and (if set) the live class link
  const email = welcomeEmail({
    studentName: student.name,
    batchName: batch.batchName,
    startDate: batch.startDate,
    endDate: batch.endDate,
    courseTitle: batch.course.title,
    amount: payment.amount,
    transactionId,
    meetingLink: batch.meeting?.meetingLink,
    meetingProvider: batch.meeting?.provider,
  });
  await sendEmail({
    to: student.email,
    subject: email.subject,
    html: email.html,
    type: "WELCOME",
    registrationId: registration.id,
  });

  // Keep future batches topped up (spec: always keep future batches available)
  await syncBatches();

  return payment;
}
