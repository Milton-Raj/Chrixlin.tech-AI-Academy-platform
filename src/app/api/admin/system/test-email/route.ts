import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/urls";

const schema = z.object({ to: z.string().email() });

/**
 * Sends a real test email so the admin can confirm Resend is wired up
 * correctly (valid API key, verified domain, working from-address) without
 * having to enroll a student to find out.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const result = await sendEmail({
    to: parsed.data.to,
    subject: "✅ Chrixlin.tech test email — delivery is working",
    html: `
<div style="font-family:Arial,sans-serif;background:#0F172A;padding:32px;">
  <div style="max-width:520px;margin:0 auto;background:#1E293B;border-radius:12px;padding:28px;border:1px solid #334155;">
    <h2 style="color:#FFFFFF;margin:0 0 12px;">Email delivery works! 🎉</h2>
    <p style="color:#CBD5E1;font-size:14px;line-height:1.6;">
      This test was sent from your Chrixlin.tech Academy admin portal.
      Welcome emails, reminders and certificates will be delivered exactly like this one.
    </p>
    <p style="color:#64748B;font-size:12px;margin-top:20px;">
      Sent from ${process.env.EMAIL_FROM ?? "Chrixlin.tech Academy <noreply@chrixlin.tech>"} via ${appUrl()}
    </p>
  </div>
</div>`,
    type: "TEST",
  });

  return NextResponse.json({ status: result.status, error: result.error });
}
