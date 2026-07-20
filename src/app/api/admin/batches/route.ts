import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncBatches } from "@/lib/batches";

export async function GET() {
  await syncBatches();
  const batches = await prisma.batch.findMany({
    include: { course: true, meeting: true, _count: { select: { registrations: true } } },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json({
    batches: batches.map((b) => ({
      id: b.id,
      batchName: b.batchName,
      courseTitle: b.course.title,
      startDate: b.startDate,
      endDate: b.endDate,
      capacity: b.capacity,
      seatsFilled: b.seatsFilled,
      status: b.status,
      autoCreated: b.autoCreated,
      registrations: b._count.registrations,
      meeting: b.meeting
        ? {
            provider: b.meeting.provider,
            meetingLink: b.meeting.meetingLink,
            startDate: b.meeting.startDate,
            expiryDate: b.meeting.expiryDate,
          }
        : null,
    })),
  });
}

const createSchema = z.object({
  batchName: z.string().min(1).max(100),
  startDate: z.string().min(1),
  capacity: z.number().int().min(1).max(10000),
});

export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const course = await prisma.course.findFirst({ where: { active: true } });
  if (!course) return NextResponse.json({ error: "No active course" }, { status: 400 });

  const startDate = new Date(parsed.data.startDate);
  const batch = await prisma.batch.create({
    data: {
      courseId: course.id,
      batchName: parsed.data.batchName,
      startDate,
      endDate: new Date(startDate.getTime() + course.durationDays * 86_400_000),
      capacity: parsed.data.capacity,
      status: "OPEN",
      autoCreated: false,
    },
  });
  return NextResponse.json({ ok: true, batch });
}
