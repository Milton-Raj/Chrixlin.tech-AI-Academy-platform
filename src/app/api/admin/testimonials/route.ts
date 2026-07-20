import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET() {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ testimonials });
}

const schema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(200).default(""),
  content: z.string().max(3000).default(""),
  imageUrl: z.string().max(1000).default(""),
  videoUrl: z.string().max(1000).default(""),
  type: z.enum(["TEXT", "IMAGE", "VIDEO"]).default("TEXT"),
  rating: z.number().int().min(1).max(5).default(5),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const testimonial = await prisma.testimonial.create({ data: parsed.data });
  return NextResponse.json({ ok: true, testimonial });
}
