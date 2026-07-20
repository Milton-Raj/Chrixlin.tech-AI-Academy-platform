import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  batchName: z.string().min(1).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  capacity: z.number().int().min(1).max(10000).optional(),
  status: z.enum(["OPEN", "RUNNING", "COMPLETED", "PAUSED", "CLOSED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { startDate, endDate, ...rest } = parsed.data;
  const batch = await prisma.batch.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
    },
  });
  return NextResponse.json({ ok: true, batch });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const paidCount = await prisma.registration.count({
    where: { batchId: id, paymentStatus: "PAID" },
  });
  if (paidCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${paidCount} paid student(s) in this batch. Close it instead.` },
      { status: 400 }
    );
  }
  await prisma.batch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
