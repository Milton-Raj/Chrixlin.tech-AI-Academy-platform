import Link from "next/link";
import { BadgeCheck, XCircle, Download, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Public certificate verification page: /certificate/CHX-2026-000001 */
export default async function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const certificateNumber = decodeURIComponent(number).toUpperCase();

  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber },
    include: { student: true },
  });

  return (
    <main className="hero-glow flex min-h-screen items-center py-12">
      <div className="container-x max-w-lg">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={16} /> Chrixlin.tech
        </Link>

        {certificate ? (
          <div className="card text-center !border-gold/30">
            <BadgeCheck size={56} className="mx-auto text-green-400" />
            <div className="badge mx-auto mt-4 border-green-400/30 bg-green-400/10 text-green-400">
              VERIFIED CERTIFICATE
            </div>
            <h1 className="mt-4 text-2xl font-bold">{certificate.student.name}</h1>
            <p className="mt-1 text-sm text-muted">has successfully completed</p>
            <p className="mt-2 text-lg font-semibold text-gold">{certificate.courseTitle}</p>

            <div className="mt-6 rounded-xl bg-navy p-5 text-left text-sm">
              <div className="grid grid-cols-2 gap-y-2.5">
                <span className="text-muted">Certificate No.</span>
                <span className="text-right font-mono text-xs font-semibold">
                  {certificate.certificateNumber}
                </span>
                <span className="text-muted">Verification Code</span>
                <span className="text-right font-mono text-xs">{certificate.verificationCode}</span>
                <span className="text-muted">Completion Date</span>
                <span className="text-right font-semibold">{formatDate(certificate.issuedDate)}</span>
                <span className="text-muted">Issued By</span>
                <span className="text-right font-semibold">Chrixlin.tech AI Academy</span>
              </div>
            </div>

            <a
              href={`/api/certificates/${certificate.certificateNumber}/pdf`}
              className="btn-cta mt-6 w-full"
            >
              <Download size={16} /> Download Certificate (PDF)
            </a>
          </div>
        ) : (
          <div className="card text-center !border-red-500/30">
            <XCircle size={56} className="mx-auto text-red-400" />
            <h1 className="mt-4 text-2xl font-bold">Certificate Not Found</h1>
            <p className="mt-2 text-sm text-muted">
              No certificate exists with number{" "}
              <span className="font-mono text-white">{certificateNumber}</span>.
              <br />
              Please check the number and try again.
            </p>
            <Link href="/" className="btn-outline mt-6 w-full">
              Go to Homepage
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
