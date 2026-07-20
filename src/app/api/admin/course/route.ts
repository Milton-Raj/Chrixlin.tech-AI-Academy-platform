import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET() {
  const course = await prisma.course.findFirst({ where: { active: true } });
  return NextResponse.json({ course });
}

const schema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(3000),
  durationDays: z.number().int().min(1).max(365),
  price: z.number().int().min(0),
  offerPrice: z.number().int().min(0),
  offerText: z.string().max(200),
  offerEndDate: z.string().nullable(),
});

/** Pricing management — landing page reflects changes immediately. */
export async function PUT(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const course = await prisma.course.findFirst({ where: { active: true } });
  if (!course) return NextResponse.json({ error: "No active course" }, { status: 400 });

  const updated = await prisma.course.update({
    where: { id: course.id },
    data: {
      ...parsed.data,
      offerEndDate: parsed.data.offerEndDate ? new Date(parsed.data.offerEndDate) : null,
    },
  });
  return NextResponse.json({ ok: true, course: updated });
}
