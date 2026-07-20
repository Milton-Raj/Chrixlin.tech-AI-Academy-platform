import { prisma } from "@/lib/db";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { syncBatches } from "@/lib/batches";

/**
 * Marks a payment as PAID by Razorpay order id and runs the post-payment
 * automation: registration -> PAID, seat count +1, welcome email (Email 1),
 * batch pipeline top-up. Idempotent — safe to hit from both the browser
 * verify call and the Razorpay webhook.
 */
export async function completePaymentByOrder(orderId: string, transactionId: string) {
  const payment = await prisma.payment.findFirst({
    where: { orderId },
    include: {
      registration: {
        include: { student: true, batch: { include: { course: true } } },
      },
    },
  });
  if (!payment) throw new Error("Payment not found for order " + orderId);
  if (payment.status === "PAID") return payment; // already processed

  const { registration } = payment;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", transactionId, paymentDate: new Date() },
    }),
    prisma.registration.update({
      where: { id: registration.id },
      data: { status: "PAID", paymentStatus: "PAID" },
    }),
    prisma.batch.update({
      where: { id: registration.batchId },
      data: { seatsFilled: { increment: 1 } },
    }),
  ]);

  // Email 1 — immediately after payment: welcome + receipt + batch details
  const email = welcomeEmail({
    studentName: registration.student.name,
    batchName: registration.batch.batchName,
    startDate: registration.batch.startDate,
    endDate: registration.batch.endDate,
    courseTitle: registration.batch.course.title,
    amount: payment.amount,
    transactionId,
  });
  await sendEmail({
    to: registration.student.email,
    subject: email.subject,
    html: email.html,
    type: "WELCOME",
    registrationId: registration.id,
  });

  // Keep future batches topped up (spec: always keep future batches available)
  await syncBatches();

  return payment;
}
