import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import EnrollFlow from "@/components/enroll/EnrollFlow";

export const dynamic = "force-dynamic";

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { course: true },
  });
  if (!batch) notFound();

  const course = batch.course;
  const offerActive =
    course.offerPrice < course.price && (!course.offerEndDate || course.offerEndDate > new Date());

  return (
    <main className="hero-glow min-h-screen py-10">
      <div className="container-x max-w-2xl">
        <Link href="/#batches" className="inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={16} /> Back to batches
        </Link>
        <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
          Enroll — <span className="text-gold">{batch.batchName}</span>
        </h1>
        <p className="mt-2 text-sm text-muted">{course.title}</p>

        <EnrollFlow
          batch={{
            id: batch.id,
            batchName: batch.batchName,
            startDate: batch.startDate.toISOString(),
            endDate: batch.endDate.toISOString(),
            capacity: batch.capacity,
            seatsFilled: batch.seatsFilled,
            status: batch.status,
          }}
          course={{
            id: course.id,
            title: course.title,
            description: course.description,
            durationDays: course.durationDays,
            price: course.price,
            offerPrice: course.offerPrice,
            offerText: course.offerText,
            offerEndDate: course.offerEndDate?.toISOString() ?? null,
          }}
          amount={offerActive ? course.offerPrice : course.price}
        />
      </div>
    </main>
  );
}
