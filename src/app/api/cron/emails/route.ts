import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { classStartEmail, reminderEmail, sendEmail } from "@/lib/email";
import { syncBatches } from "@/lib/batches";
import { getSettings, settingInt } from "@/lib/settings";

const HOUR = 3_600_000;

/**
 * Email automation cron: pre-batch reminders and the class-start link.
 * Also rolls the batch pipeline forward.
 *
 * Schedule this endpoint hourly:
 *   GET /api/cron/emails  with header  Authorization: Bearer <CRON_SECRET>
 *
 * Reminder timings come from admin settings (reminderHours1 / reminderHours2),
 * defaulting to 24h and 1h before the batch starts.
 *
 * A reminder fires once the batch is within its window rather than only at the
 * exact hour, so a late or infrequent cron run still delivers instead of
 * silently skipping. An EmailLog row per (registration, type) prevents
 * duplicates, so running this more often than needed is harmless.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncBatches();
  const settings = await getSettings();
  const now = new Date();
  let reminders = 0;
  let classStarts = 0;

  // --- Pre-batch reminders at the two configured offsets -------------------
  const windows = [
    { hours: settingInt(settings, "reminderHours1", 24), type: "REMINDER_1" },
    { hours: settingInt(settings, "reminderHours2", 1), type: "REMINDER_2" },
  ].filter((w) => w.hours > 0);

  for (const w of windows) {
    const startingSoon = await prisma.batch.findMany({
      where: { startDate: { gt: now, lte: new Date(now.getTime() + w.hours * HOUR) } },
      include: {
        meeting: true,
        registrations: { where: { paymentStatus: "PAID" }, include: { student: true } },
      },
    });
    for (const batch of startingSoon) {
      for (const reg of batch.registrations) {
        const already = await prisma.emailLog.findFirst({
          where: { registrationId: reg.id, type: w.type, status: { not: "FAILED" } },
        });
        if (already) continue;
        const email = reminderEmail({
          studentName: reg.student.name,
          batchName: batch.batchName,
          startDate: batch.startDate,
          hoursBefore: w.hours,
          meetingLink: batch.meeting?.meetingLink,
          meetingProvider: batch.meeting?.provider,
          whatsappGroupLink: batch.whatsappGroupLink,
        });
        await sendEmail({
          to: reg.student.email,
          subject: email.subject,
          html: email.html,
          type: w.type,
          registrationId: reg.id,
        });
        reminders++;
      }
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
