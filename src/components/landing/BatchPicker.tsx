"use client";

import Link from "next/link";
import { Calendar, Clock, Users, ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import type { PublicBatch } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function BatchPicker({
  batches,
  durationDays,
}: {
  batches: PublicBatch[];
  durationDays: number;
}) {
  return (
    <section className="py-24" id="batches">
      <div className="container-x">
        <Reveal className="text-center">
          <h2 className="section-title">Choose Your Batch</h2>
          <p className="section-sub mx-auto max-w-2xl">
            Live cohorts with limited seats. New batches open automatically — pick the one that fits.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {batches.length === 0 && (
            <div className="card col-span-full text-center text-muted">
              New batches are being scheduled — check back shortly.
            </div>
          )}
          {batches.map((b, i) => {
            const seatsLeft = Math.max(b.capacity - b.seatsFilled, 0);
            const pct = Math.min(Math.round((b.seatsFilled / b.capacity) * 100), 100);
            const full = seatsLeft === 0;
            const fillingFast = !full && pct >= 60;
            return (
              <Reveal key={b.id} delay={i * 0.1}>
                <div
                  className={`card relative h-full overflow-hidden transition hover:-translate-y-1 ${
                    i === 0 ? "border-gold/40" : ""
                  }`}
                >
                  {i === 0 && (
                    <span className="absolute right-0 top-0 rounded-bl-xl bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-navy">
                      Next Batch
                    </span>
                  )}
                  <h3 className="text-xl font-bold">{b.batchName}</h3>
                  <div className="mt-4 space-y-2.5 text-sm text-muted">
                    <div className="flex items-center gap-2.5">
                      <Calendar size={15} className="text-electric" />
                      Starts <b className="text-white">{formatDate(b.startDate)}</b>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock size={15} className="text-electric" />
                      {durationDays} days • Live classes
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Users size={15} className="text-electric" />
                      {full ? (
                        <span className="font-semibold text-red-400">Batch Full</span>
                      ) : (
                        <>
                          <b className={fillingFast ? "text-cta" : "text-white"}>{seatsLeft}</b>
                          seats remaining
                          {fillingFast && (
                            <span className="rounded-full bg-cta/15 px-2 py-0.5 text-[10px] font-bold uppercase text-cta">
                              Filling fast
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* seat fill bar */}
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${full ? "bg-red-500" : "bg-gradient-to-r from-electric to-gold"}`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>

                  {full ? (
                    <button disabled className="btn-outline mt-6 w-full">
                      Sold Out
                    </button>
                  ) : (
                    <Link href={`/enroll/${b.id}`} className="btn-cta mt-6 w-full">
                      Enroll Now <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
