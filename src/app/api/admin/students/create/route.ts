import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail, welcomeEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
  country: z.string().max(100).default("India"),
  profession: z.string().max(200).default(""),
  experience: z.string().max(200).default(""),
  batchId: z.string().min(1),
  amount: z.number().int().min(0),
  method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CARD", "NETBANKING", "OTHER"]).default("OTHER"),
  transactionId: z.string().max(200).default(""),
  notes: z.string().max(2000).default(""),
  sendWelcomeEmail: z.boolean().default(true),
});

/**
 * Manual enrollment from the admin portal — for students who paid offline
 * (cash, bank transfer, UPI to the business account). Creates the same
 * student/registration/payment records the online flow produces, marked
 * source=ADMIN_MANUAL and provider=MANUAL so the two are distinguishable.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const batch = await prisma.batch.findUnique({
    where: { id: d.batchId },
    include: { course: true, meeting: true },
  });
  if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 400 });

  const student = await prisma.student.upsert({
    where: { email: d.email },
    update: {
      name: d.name,
      phone: d.phone,
      country: d.country,
      profession: d.profession,
      experience: d.experience,
    },
    create: {
      name: d.name,
      email: d.email,
      phone: d.phone,
      country: d.country,
      profession: d.profession,
      experience: d.experience,
    },
  });

  const already = await prisma.registration.findUnique({
    where: { studentId_batchId: { studentId: student.id, batchId: batch.id } },
  });
  if (already?.paymentStatus === "PAID") {
    return NextResponse.json(
      { error: `${d.name} is already enrolled in ${batch.batchName}` },
      { status: 400 }
    );
  }

  const registration = await prisma.registration.upsert({
    where: { studentId_batchId: { studentId: student.id, batchId: batch.id } },
    update: { status: "PAID", paymentStatus: "PAID", source: "ADMIN_MANUAL", notes: d.notes },
    create: {
      studentId: student.id,
      batchId: batch.id,
      status: "PAID",
      paymentStatus: "PAID",
      source: "ADMIN_MANUAL",
      notes: d.notes,
    },
  });

  await prisma.payment.create({
    data: {
      registrationId: registration.id,
      amount: d.amount,
      provider: "MANUAL",
      method: d.method,
      transactionId: d.transactionId || null,
      status: "PAID",
      paymentDate: new Date(),
    },
  });

  await prisma.batch.update({
    where: { id: batch.id },
    data: { seatsFilled: { increment: 1 } },
  });

  let emailStatus: string | null = null;
  if (d.sendWelcomeEmail) {
    const email = welcomeEmail({
      studentName: student.name,
      batchName: batch.batchName,
      startDate: batch.startDate,
      endDate: batch.endDate,
      courseTitle: batch.course.title,
      amount: d.amount,
      transactionId: d.transactionId || "Manual enrollment",
      meetingLink: batch.meeting?.meetingLink,
      meetingProvider: batch.meeting?.provider,
      whatsappGroupLink: batch.whatsappGroupLink,
    });
    const result = await sendEmail({
      to: student.email,
      subject: email.subject,
      html: email.html,
      type: "WELCOME",
      registrationId: registration.id,
    });
    emailStatus = result.status;
  }

  return NextResponse.json({ ok: true, studentId: student.id, emailStatus });
}
