import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { classStartEmail, reminderEmail, sendEmail } from "@/lib/email";
import { syncBatches } from "@/lib/batches";

const DAY = 86_400_000;

/**
 * Email automation cron (spec: Email 2 — 1 day before start; Email 3 — class
 * start with meeting link). Also rolls the batch pipeline forward.
 *
 * Schedule this endpoint (e.g. Vercel Cron, daily):
 *   GET /api/cron/emails  with header  Authorization: Bearer <CRON_SECRET>
 *
 * Deduplication: an EmailLog row per (registration, type) guards against
 * re-sends, so running the cron more often than daily is safe.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncBatches();
  const now = new Date();
  let reminders = 0;
  let classStarts = 0;

  // --- Email 2: reminder for batches starting within the next 24h ----------
  const startingSoon = await prisma.batch.findMany({
    where: { startDate: { gt: now, lte: new Date(now.getTime() + DAY) } },
    include: { registrations: { where: { paymentStatus: "PAID" }, include: { student: true } } },
  });
  for (const batch of startingSoon) {
    for (const reg of batch.registrations) {
      const already = await prisma.emailLog.findFirst({
        where: { registrationId: reg.id, type: "REMINDER", status: { not: "FAILED" } },
      });
      if (already) continue;
      const email = reminderEmail({
        studentName: reg.student.name,
        batchName: batch.batchName,
        startDate: batch.startDate,
      });
      await sendEmail({
        to: reg.student.email,
        subject: email.subject,
        html: email.html,
        type: "REMINDER",
        registrationId: reg.id,
      });
      reminders++;
    }
  }

  // --- Email 3: meeting link for batches that have started -----------------
  const started = await prisma.batch.findMany({
    where: { startDate: { lte: now }, endDate: { gte: now }, meeting: { isNot: null } },
    include: {
      meeting: true,
      registrations: { where: { paymentStatus: "PAID" }, include: { student: true } },
    },
  });
  for (const batch of started) {
    const meeting = batch.meeting!;
    if (meeting.expiryDate && meeting.expiryDate < now) continue;
    for (const reg of batch.registrations) {
      const already = await prisma.emailLog.findFirst({
        where: { registrationId: reg.id, type: "CLASS_START", status: { not: "FAILED" } },
      });
      if (already) continue;
      const email = classStartEmail({
        studentName: reg.student.name,
        batchName: batch.batchName,
        provider: meeting.provider,
        meetingLink: meeting.meetingLink,
      });
      await sendEmail({
        to: reg.student.email,
        subject: email.subject,
        html: email.html,
        type: "CLASS_START",
        registrationId: reg.id,
      });
      classStarts++;
      // Registration moves to STARTED once the class link goes out
      await prisma.registration.update({
        where: { id: reg.id },
        data: { status: "STARTED" },
      });
    }
  }

  return NextResponse.json({ ok: true, reminders, classStarts });
}
