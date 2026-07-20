import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { issueCertificate } from "@/lib/certificates";

/** Paid registrations with certificate state — the completion approval queue. */
export async function GET() {
  const registrations = await prisma.registration.findMany({
    where: { paymentStatus: "PAID" },
    include: {
      student: true,
      batch: { include: { course: true } },
      certificate: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    registrations: registrations.map((r) => ({
      id: r.id,
      studentName: r.student.name,
      studentEmail: r.student.email,
      batchName: r.batch.batchName,
      courseTitle: r.batch.course.title,
      status: r.status,
      certificate: r.certificate
        ? {
            certificateNumber: r.certificate.certificateNumber,
            verificationCode: r.certificate.verificationCode,
            issuedDate: r.certificate.issuedDate,
          }
        : null,
    })),
  });
}

const schema = z.object({ registrationId: z.string().min(1) });

/** Approve completion → generate certificate + email it (spec: CERTIFICATE AUTOMATION). */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  try {
    const certificate = await issueCertificate(parsed.data.registrationId);
    return NextResponse.json({ ok: true, certificate });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to issue certificate" },
      { status: 400 }
    );
  }
}
