import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { formatDate, inr } from "@/lib/format";

/**
 * Email automation (spec: EMAIL AUTOMATION).
 * Uses Resend when RESEND_API_KEY is set; otherwise logs the email to the
 * EmailLog table with status SKIPPED_NO_KEY so the flow is testable in dev.
 * Every attempt (sent, failed, skipped) is recorded in EmailLog — the cron
 * endpoint also uses EmailLog to avoid sending duplicates.
 */

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  type: string; // WELCOME | REMINDER | CLASS_START | CERTIFICATE | CONTACT
  registrationId?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  let status = "SKIPPED_NO_KEY";
  let error: string | null = null;

  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "Chrixlin.tech <onboarding@resend.dev>",
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      if (result.error) {
        status = "FAILED";
        error = result.error.message;
      } else {
        status = "SENT";
      }
    } catch (e) {
      status = "FAILED";
      error = e instanceof Error ? e.message : String(e);
    }
  }

  await prisma.emailLog.create({
    data: {
      registrationId: opts.registrationId,
      type: opts.type,
      toEmail: opts.to,
      subject: opts.subject,
      status,
      error,
    },
  });

  return { status, error };
}

/** Shared branded wrapper (email-client-safe, table-based). */
function shell(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0F172A;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:32px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1E293B;border-radius:12px;overflow:hidden;border:1px solid #334155;">
        <tr>
          <td style="background:#0F172A;padding:24px 32px;border-bottom:2px solid #F59E0B;">
            <span style="color:#FFFFFF;font-size:20px;font-weight:bold;">Chrixlin<span style="color:#F59E0B;">.tech</span></span>
            <span style="color:#94A3B8;font-size:12px;float:right;padding-top:6px;">AI Academy</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="color:#FFFFFF;font-size:22px;margin:0 0 16px;">${title}</h1>
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="background:#0F172A;padding:20px 32px;color:#64748B;font-size:12px;">
            © ${new Date().getFullYear()} Chrixlin.tech — Premium AI Academy<br/>
            <a href="${appUrl()}" style="color:#3B82F6;">${appUrl().replace(/^https?:\/\//, "")}</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const p = (text: string) =>
  `<p style="color:#CBD5E1;font-size:15px;line-height:1.6;margin:0 0 14px;">${text}</p>`;

const infoRow = (label: string, value: string) =>
  `<tr><td style="color:#94A3B8;font-size:13px;padding:6px 12px 6px 0;white-space:nowrap;">${label}</td><td style="color:#FFFFFF;font-size:13px;padding:6px 0;font-weight:bold;">${value}</td></tr>`;

const button = (href: string, label: string) =>
  `<table cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:#FF6B00;border-radius:8px;">
     <a href="${href}" style="display:inline-block;padding:12px 28px;color:#FFFFFF;font-size:15px;font-weight:bold;text-decoration:none;">${label}</a>
   </td></tr></table>`;

// ---------------------------------------------------------------------------
// Email 1 — immediately after payment: welcome + receipt + batch details
export function welcomeEmail(d: {
  studentName: string;
  batchName: string;
  startDate: Date;
  endDate: Date;
  courseTitle: string;
  amount: number;
  transactionId: string;
  meetingLink?: string;
  meetingProvider?: string;
}) {
  const providerName =
    d.meetingProvider === "GOOGLE_MEET"
      ? "Google Meet"
      : d.meetingProvider === "TEAMS"
        ? "Microsoft Teams"
        : "Zoom";

  // Include the live class link straight away when the batch already has one,
  // so students can save it the moment they pay.
  const meetingBlock = d.meetingLink
    ? p(`Your live classes run on <b style="color:#FFFFFF;">${providerName}</b>. Save this link — it's the same one for every session:`) +
      button(d.meetingLink, `Join ${providerName} Class`) +
      p(`If the button doesn't work, paste this into your browser:<br/><a href="${d.meetingLink}" style="color:#3B82F6;word-break:break-all;">${d.meetingLink}</a>`) +
      p(`We'll also remind you a day before ${d.batchName} starts.`)
    : p(`Your live class meeting link will be emailed to you before the batch starts. Keep an eye on your inbox.`) +
      button(appUrl(), "Visit Chrixlin.tech");

  return {
    subject: `Welcome to ${d.courseTitle} — you're in ${d.batchName}! 🎉`,
    html: shell(
      `Welcome aboard, ${d.studentName}!`,
      p(`Your payment is confirmed and your seat in <b style="color:#F59E0B;">${d.batchName}</b> is locked in. Get ready to master AI, automation and digital growth skills.`) +
        `<table cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:8px;padding:8px;width:100%;margin:8px 0 16px;"><tr><td style="padding:16px;">
          <table cellpadding="0" cellspacing="0">
            ${infoRow("Course", d.courseTitle)}
            ${infoRow("Batch", d.batchName)}
            ${infoRow("Start date", formatDate(d.startDate))}
            ${infoRow("End date", formatDate(d.endDate))}
            ${infoRow("Amount paid", inr(d.amount))}
            ${infoRow("Transaction ID", d.transactionId)}
          </table>
        </td></tr></table>` +
        meetingBlock
    ),
  };
}

// Email 2 — one day before start
export function reminderEmail(d: { studentName: string; batchName: string; startDate: Date }) {
  return {
    subject: `Reminder: ${d.batchName} starts tomorrow!`,
    html: shell(
      `Your class starts tomorrow, ${d.studentName}!`,
      p(`<b style="color:#F59E0B;">${d.batchName}</b> begins on <b style="color:#FFFFFF;">${formatDate(d.startDate)}</b>.`) +
        p(`Get your notebook ready, charge your laptop, and come with questions. The meeting link will arrive in a separate email when class begins.`) +
        button(appUrl(), "View Course Details")
    ),
  };
}

// Email 3 — class start: meeting link
export function classStartEmail(d: {
  studentName: string;
  batchName: string;
  provider: string;
  meetingLink: string;
}) {
  const providerName =
    d.provider === "GOOGLE_MEET" ? "Google Meet" : d.provider === "TEAMS" ? "Microsoft Teams" : "Zoom";
  return {
    subject: `🔴 ${d.batchName} is live — join your ${providerName} class`,
    html: shell(
      `It's class time, ${d.studentName}!`,
      p(`<b style="color:#F59E0B;">${d.batchName}</b> is starting. Join the live session on <b style="color:#FFFFFF;">${providerName}</b>:`) +
        button(d.meetingLink, `Join ${providerName} Class`) +
        p(`Link not working? Copy and paste this into your browser:<br/><a href="${d.meetingLink}" style="color:#3B82F6;word-break:break-all;">${d.meetingLink}</a>`)
    ),
  };
}

// Email 4 — course completion: certificate
export function certificateEmail(d: {
  studentName: string;
  courseTitle: string;
  certificateNumber: string;
}) {
  const verifyUrl = `${appUrl()}/certificate/${d.certificateNumber}`;
  const pdfUrl = `${appUrl()}/api/certificates/${d.certificateNumber}/pdf`;
  return {
    subject: `🎓 Your Chrixlin.tech certificate is ready — ${d.certificateNumber}`,
    html: shell(
      `Congratulations, ${d.studentName}!`,
      p(`You have successfully completed <b style="color:#F59E0B;">${d.courseTitle}</b>. Your verified certificate is ready.`) +
        `<table cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:8px;width:100%;margin:8px 0 16px;"><tr><td style="padding:16px;">
          <table cellpadding="0" cellspacing="0">
            ${infoRow("Certificate No.", d.certificateNumber)}
            ${infoRow("Verification", `<a href="${verifyUrl}" style="color:#3B82F6;">${verifyUrl}</a>`)}
          </table>
        </td></tr></table>` +
        button(pdfUrl, "Download Certificate (PDF)") +
        p(`Add it to your LinkedIn profile — employers can verify it any time using the link above.`)
    ),
  };
}
