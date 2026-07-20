import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** CSV export (opens directly in Excel). */
export async function GET() {
  const students = await prisma.student.findMany({
    include: {
      registrations: {
        orderBy: { createdAt: "desc" },
        include: { batch: true, payments: { where: { status: "PAID" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = [
    "Name",
    "Email",
    "Phone",
    "Country",
    "Profession",
    "Experience",
    "Batch",
    "Status",
    "Payment Status",
    "Amount Paid",
    "Registered On",
    "Active",
  ];
  const lines = students.map((s) => {
    const reg = s.registrations[0];
    const paid = reg?.payments.reduce((sum, p) => sum + p.amount, 0) ?? 0;
    return [
      s.name,
      s.email,
      s.phone,
      s.country,
      s.profession,
      s.experience,
      reg?.batch.batchName ?? "",
      reg?.status ?? "",
      reg?.paymentStatus ?? "",
      paid,
      s.createdAt.toISOString().slice(0, 10),
      s.active ? "Yes" : "No",
    ]
      .map(esc)
      .join(",");
  });

  const csv = [header.map(esc).join(","), ...lines].join("\r\n");
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chrixlin-students-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
