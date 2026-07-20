import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { certificateEmail, sendEmail } from "@/lib/email";

const schema = z.object({ registrationId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const registration = await prisma.registration.findUnique({
    where: { id: parsed.data.registrationId },
    include: { student: true, certificate: true },
  });
  if (!registration?.certificate) {
    return NextResponse.json({ error: "No certificate issued yet" }, { status: 400 });
  }

  const email = certificateEmail({
    studentName: registration.student.name,
    courseTitle: registration.certificate.courseTitle,
    certificateNumber: registration.certificate.certificateNumber,
  });
  const result = await sendEmail({
    to: registration.student.email,
    subject: email.subject,
    html: email.html,
    type: "CERTIFICATE",
    registrationId: registration.id,
  });

  return NextResponse.json({ ok: true, emailStatus: result.status });
}
