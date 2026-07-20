import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

/**
 * Read-only health check for the Settings screen: which integrations are wired
 * up, and is the scheduler actually running. Reports only whether a credential
 * is present — never its value.
 */
export async function GET() {
  const settings = await getSettings();

  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  const paymentsLive = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const cronSecretSet = Boolean(process.env.CRON_SECRET);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const lastRun = settings.cronLastRunAt ? new Date(settings.cronLastRunAt) : null;
  const hoursSinceRun = lastRun ? (Date.now() - lastRun.getTime()) / 3_600_000 : null;

  const [emailsSent, emailsLogged, emailsFailed] = await Promise.all([
    prisma.emailLog.count({ where: { status: "SENT" } }),
    prisma.emailLog.count({ where: { status: "SKIPPED_NO_KEY" } }),
    prisma.emailLog.count({ where: { status: "FAILED" } }),
  ]);

  return NextResponse.json({
    email: {
      configured: emailConfigured,
      sent: emailsSent,
      logged: emailsLogged,
      failed: emailsFailed,
    },
    payments: { live: paymentsLive },
    cron: {
      secretSet: cronSecretSet,
      lastRunAt: lastRun?.toISOString() ?? null,
      healthy: hoursSinceRun !== null && hoursSinceRun < 3,
      endpoint: `${appUrl}/api/cron/emails`,
    },
    appUrl: {
      value: appUrl,
      looksLocal: appUrl.includes("localhost"),
    },
  });
}
