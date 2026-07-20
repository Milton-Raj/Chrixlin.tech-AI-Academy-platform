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
