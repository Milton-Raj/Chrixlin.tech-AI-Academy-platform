import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: z.string().max(200).optional(),
  content: z.string().max(3000).optional(),
  imageUrl: z.string().max(1000).optional(),
  videoUrl: z.string().max(1000).optional(),
  type: z.enum(["TEXT", "IMAGE", "VIDEO"]).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const testimonial = await prisma.testimonial.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true, testimonial });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.testimonial.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
