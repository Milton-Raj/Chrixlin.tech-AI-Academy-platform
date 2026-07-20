import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Mail, CalendarClock, Video } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate, inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ registrationId: string }>;
}) {
  const { registrationId } = await params;
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      student: true,
      batch: { include: { course: true } },
      payments: { where: { status: "PAID" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!registration || registration.paymentStatus !== "PAID") notFound();

  const payment = registration.payments[0];
  const { batch, student } = registration;

  const next = [
    {
      icon: Mail,
      title: "Check your inbox",
      desc: `Welcome email with your receipt sent to ${student.email}`,
    },
    {
      icon: CalendarClock,
      title: "Reminder before class",
      desc: `We'll remind you one day before ${batch.batchName} starts on ${formatDate(batch.startDate)}`,
    },
    {
      icon: Video,
      title: "Live class link",
      desc: "Your meeting link arrives by email when the batch begins",
    },
  ];

  return (
    <main className="hero-glow flex min-h-screen items-center py-12">
      <div className="container-x max-w-xl">
        <div className="card text-center">
          <CheckCircle2 size={56} className="mx-auto text-green-400" />
          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">You&apos;re In! 🎉</h1>
          <p className="mt-2 text-sm text-muted">
            Welcome to <b className="text-gold">{batch.course.title}</b>
          </p>

          <div className="mt-6 rounded-xl bg-navy p-5 text-left text-sm">
            <div className="grid grid-cols-2 gap-y-2.5">
              <span className="text-muted">Student</span>
              <span className="text-right font-semibold">{student.name}</span>
              <span className="text-muted">Batch</span>
              <span className="text-right font-semibold">{batch.batchName}</span>
              <span className="text-muted">Starts</span>
              <span className="text-right font-semibold">{formatDate(batch.startDate)}</span>
              <span className="text-muted">Amount paid</span>
              <span className="text-right font-semibold text-gold">
                {payment ? inr(payment.amount) : "—"}
              </span>
              <span className="text-muted">Transaction ID</span>
              <span className="text-right font-mono text-xs">{payment?.transactionId ?? "—"}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-left">
            {next.map((n) => (
              <div key={n.title} className="flex items-start gap-3 rounded-xl border border-white/10 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric/15 text-electric">
                  <n.icon size={18} />
                </span>
                <div>
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="text-xs text-muted">{n.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <Link href="/" className="btn-outline mt-8 w-full">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
