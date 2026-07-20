import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncBatches } from "@/lib/batches";

const DAY = 86_400_000;

export async function GET() {
  await syncBatches();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    totalRevenue,
    todayRevenue,
    monthRevenue,
    yearRevenue,
    regsToday,
    regsMonth,
    regsYear,
    regsTotal,
    regsPaid,
    activeStudents,
    completedStudents,
    upcomingBatches,
    fillBatches,
    recentPayments,
    recentRegs,
  ] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.aggregate({
      where: { status: "PAID", paymentDate: { gte: startOfDay } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", paymentDate: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", paymentDate: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    prisma.registration.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.registration.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.registration.count({ where: { createdAt: { gte: startOfYear } } }),
    prisma.registration.count(),
    prisma.registration.count({ where: { paymentStatus: "PAID" } }),
    prisma.registration.count({ where: { status: { in: ["PAID", "STARTED"] } } }),
    prisma.registration.count({ where: { status: "COMPLETED" } }),
    prisma.batch.findMany({
      where: { status: "OPEN", startDate: { gt: now } },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
    prisma.batch.findMany({
      where: { status: { in: ["OPEN", "RUNNING"] } },
      orderBy: { startDate: "asc" },
      take: 8,
    }),
    prisma.payment.findMany({
      where: { status: "PAID", paymentDate: { gte: new Date(now.getTime() - 180 * DAY) } },
      select: { amount: true, paymentDate: true },
    }),
    prisma.registration.findMany({
      where: { createdAt: { gte: new Date(now.getTime() - 14 * DAY) } },
      select: { createdAt: true },
    }),
  ]);

  // Revenue by month (last 6 months)
  const revenueByMonth: { label: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const revenue = recentPayments
      .filter((p) => p.paymentDate && p.paymentDate >= d && p.paymentDate < next)
      .reduce((s, p) => s + p.amount, 0);
    revenueByMonth.push({
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      revenue,
    });
  }

  // Registrations by day (last 14 days)
  const registrationsByDay: { label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(startOfDay.getTime() - i * DAY);
    const next = new Date(d.getTime() + DAY);
    registrationsByDay.push({
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      count: recentRegs.filter((r) => r.createdAt >= d && r.createdAt < next).length,
    });
  }

  return NextResponse.json({
    revenue: {
      total: totalRevenue._sum.amount ?? 0,
      today: todayRevenue._sum.amount ?? 0,
      month: monthRevenue._sum.amount ?? 0,
      year: yearRevenue._sum.amount ?? 0,
    },
    registrations: { today: regsToday, month: regsMonth, year: regsYear },
    students: { active: activeStudents, completed: completedStudents },
    conversionRate: regsTotal > 0 ? Math.round((regsPaid / regsTotal) * 100) : 0,
    upcomingBatches: upcomingBatches.map((b) => ({
      id: b.id,
      batchName: b.batchName,
      startDate: b.startDate,
      seatsFilled: b.seatsFilled,
      capacity: b.capacity,
    })),
    batchFill: fillBatches.map((b) => ({
      batchName: b.batchName,
      seatsFilled: b.seatsFilled,
      capacity: b.capacity,
      status: b.status,
    })),
    revenueByMonth,
    registrationsByDay,
  });
}
