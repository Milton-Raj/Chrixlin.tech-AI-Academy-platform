import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderCertificatePdf } from "@/lib/certificates";
import { getSettings } from "@/lib/settings";

/** Streams the certificate PDF, rendered on demand (works on serverless). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const certificateNumber = decodeURIComponent(number).toUpperCase();

  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber },
    include: { student: true },
  });
  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const settings = await getSettings();
  const pdf = await renderCertificatePdf(
    {
      studentName: certificate.student.name,
      courseTitle: certificate.courseTitle,
      certificateNumber: certificate.certificateNumber,
      verificationCode: certificate.verificationCode,
      issuedDate: certificate.issuedDate,
    },
    {
      logo: settings.certLogo,
      signature: settings.certSignature,
      signatoryName: settings.certSignatoryName,
    }
  );

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${certificate.certificateNumber}.pdf"`,
    },
  });
}
