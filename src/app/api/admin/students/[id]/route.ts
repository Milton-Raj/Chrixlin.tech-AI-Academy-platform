import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(30).optional(),
  country: z.string().max(100).optional(),
  profession: z.string().max(200).optional(),
  experience: z.string().max(200).optional(),
  active: z.boolean().optional(),
  // updates the student's latest registration status (Registered/Paid/Started/Completed/Cancelled)
  registrationStatus: z
    .enum(["REGISTERED", "PAID", "STARTED", "COMPLETED", "CANCELLED"])
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { registrationStatus, ...studentData } = parsed.data;

  const student = await prisma.student.update({ where: { id }, data: studentData });

  if (registrationStatus) {
    const latest = await prisma.registration.findFirst({
      where: { studentId: id },
      orderBy: { createdAt: "desc" },
    });
    if (latest) {
      await prisma.registration.update({
        where: { id: latest.id },
        data: { status: registrationStatus },
      });
    }
  }

  return NextResponse.json({ ok: true, student });
}

/**
 * Permanently delete a student and everything tied to them — registrations,
 * payments and certificates all cascade (see schema onDelete: Cascade). Before
 * deleting, release the seats their paid registrations were holding so batch
 * counts stay accurate.
 *
 * EmailLog rows are kept: they are an audit trail of what was sent, not part of
 * the student's profile, and they carry no foreign key to cascade.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: { registrations: true },
  });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Free up the seats held by paid registrations.
  const paidByBatch = new Map<string, number>();
  for (const reg of student.registrations) {
    if (reg.paymentStatus === "PAID") {
      paidByBatch.set(reg.batchId, (paidByBatch.get(reg.batchId) ?? 0) + 1);
    }
  }

  await prisma.$transaction([
    ...Array.from(paidByBatch.entries()).map(([batchId, count]) =>
      prisma.batch.update({
        where: { id: batchId },
        data: { seatsFilled: { decrement: count } },
      })
    ),
    prisma.student.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
