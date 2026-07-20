import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET() {
  const faqs = await prisma.faq.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ faqs });
}

const schema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const faq = await prisma.faq.create({ data: parsed.data });
  return NextResponse.json({ ok: true, faq });
}
