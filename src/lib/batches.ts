import { prisma } from "@/lib/db";
import { getSettings, settingInt } from "@/lib/settings";

/**
 * Batch automation (spec: BATCH AUTOMATION SYSTEM).
 *
 * - Rolls batch statuses forward:   OPEN -> RUNNING -> COMPLETED  by date.
 * - Always keeps `parallelBatches` future OPEN batches available, auto-named
 *   "Batch N", spaced `batchStaggerDays` apart, sized `defaultCapacity`,
 *   with duration from the course. No manual batch creation required.
 *
 * Called from the landing page, the admin dashboard, and the cron endpoint,
 * so the pipeline self-heals on every visit.
 */
export async function syncBatches() {
  const course = await prisma.course.findFirst({ where: { active: true } });
  if (!course) return;

  const now = new Date();

  // 1) Roll statuses forward by date (skip admin-managed PAUSED/CLOSED).
  await prisma.batch.updateMany({
    where: { status: "OPEN", startDate: { lte: now } },
    data: { status: "RUNNING" },
  });
  await prisma.batch.updateMany({
    where: { status: "RUNNING", endDate: { lt: now } },
    data: { status: "COMPLETED" },
  });

  // 2) Top up future OPEN batches.
  const settings = await getSettings();
  const parallel = settingInt(settings, "parallelBatches", 2);
  const capacity = settingInt(settings, "defaultCapacity", 25);
  const stagger = settingInt(settings, "batchStaggerDays", 7);
  const leadDays = settingInt(settings, "firstBatchLeadDays", 7);

  const future = await prisma.batch.findMany({
    where: { courseId: course.id, status: "OPEN", startDate: { gt: now } },
    orderBy: { startDate: "asc" },
  });

  let missing = parallel - future.length;
  if (missing <= 0) return;

  const totalBatches = await prisma.batch.count({ where: { courseId: course.id } });
  let lastStart =
    future.length > 0
      ? future[future.length - 1].startDate
      : new Date(now.getTime() + (leadDays - stagger) * 86_400_000);

  let batchNumber = totalBatches + 1;
  while (missing > 0) {
    const startDate = new Date(lastStart.getTime() + stagger * 86_400_000);
    const endDate = new Date(startDate.getTime() + course.durationDays * 86_400_000);
    await prisma.batch.create({
      data: {
        courseId: course.id,
        batchName: `Batch ${batchNumber}`,
        startDate,
        endDate,
        capacity,
        seatsFilled: 0,
        status: "OPEN",
        autoCreated: true,
      },
    });
    lastStart = startDate;
    batchNumber += 1;
    missing -= 1;
  }
}

/** Batches shown on the landing page: upcoming/open, soonest first. */
export async function getEnrollableBatches() {
  await syncBatches();
  return prisma.batch.findMany({
    where: { status: "OPEN", startDate: { gt: new Date() } },
    orderBy: { startDate: "asc" },
    include: { course: true },
  });
}
