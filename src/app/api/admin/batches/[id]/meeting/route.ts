import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  provider: z.enum(["ZOOM", "GOOGLE_MEET", "TEAMS"]),
  meetingLink: z.string().url(),
  startDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
});

/** Upsert the meeting for a batch. The cron endpoint emails the link automatically. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input — a valid meeting URL is required" }, { status: 400 });
  }
  const data = {
    provider: parsed.data.provider,
    meetingLink: parsed.data.meetingLink,
    startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
    expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
  };
  const meeting = await prisma.meeting.upsert({
    where: { batchId: id },
    update: data,
    create: { batchId: id, ...data },
  });
  return NextResponse.json({ ok: true, meeting });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.meeting.deleteMany({ where: { batchId: id } });
  return NextResponse.json({ ok: true });
}
