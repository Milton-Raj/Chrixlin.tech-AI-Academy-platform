import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** List students with latest registration info; supports ?q= search and ?status= filter. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const status = req.nextUrl.searchParams.get("status") ?? "";

  const students = await prisma.student.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    include: {
      registrations: {
        orderBy: { createdAt: "desc" },
        include: { batch: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = students
    .map((s) => {
      const latest = s.registrations[0];
      return {
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        country: s.country,
        profession: s.profession,
        experience: s.experience,
        active: s.active,
        createdAt: s.createdAt,
        registrationId: latest?.id ?? null,
        registrationStatus: latest?.status ?? "NONE",
        paymentStatus: latest?.paymentStatus ?? "NONE",
        batchName: latest?.batch.batchName ?? "—",
      };
    })
    .filter((r) => !status || r.registrationStatus === status);

  return NextResponse.json({ students: rows });
}
