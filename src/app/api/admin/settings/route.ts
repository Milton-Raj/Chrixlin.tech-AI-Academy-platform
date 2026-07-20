import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSettings, setSettings, SETTING_DEFAULTS } from "@/lib/settings";

export async function GET() {
  return NextResponse.json({ settings: await getSettings() });
}

const schema = z.record(z.string(), z.string());

/** CMS + configuration writes (only known keys accepted). */
export async function PUT(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const known = Object.fromEntries(
    Object.entries(parsed.data).filter(([key]) => key in SETTING_DEFAULTS)
  );
  await setSettings(known);
  return NextResponse.json({ ok: true, settings: await getSettings() });
}
