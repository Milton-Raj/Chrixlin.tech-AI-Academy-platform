"use client";

import { Check, Flame, TimerReset } from "lucide-react";
import Reveal from "@/components/Reveal";
import type { PublicCourse } from "@/lib/types";
import { inr, discountPercent, formatDate } from "@/lib/format";
import { useOfferCountdown, splitTime } from "@/components/landing/offer";

function TimeBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 rounded-lg border border-cta/40 bg-navy px-2 py-2 font-mono text-2xl font-bold text-cta shadow-lg shadow-cta/10">
        {value}
      </div>
      <span className="mt-1 text-[10px] uppercase tracking-wider text-muted">{label}</span>
    </div>
  );
}

function CountdownTimer({ minutes, label }: { minutes: number; label: string }) {
  const secondsLeft = useOfferCountdown(minutes);
  if (minutes <= 0 || secondsLeft === null) return null;

  const t = splitTime(secondsLeft);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cta">
        {secondsLeft === 0 ? <Flame size={14} /> : <TimerReset size={14} />} {label}
      </div>
      <div className="mt-3 flex items-start justify-center gap-2">
        {t.showHours && (
          <>
            <TimeBox value={t.hours} label="hrs" />
            <span className="pt-1.5 text-2xl font-bold text-muted">:</span>
          </>
        )}
        <TimeBox value={t.minutes} label="min" />
        <span className="pt-1.5 text-2xl font-bold text-muted">:</span>
        <TimeBox value={t.seconds} label="sec" />
      </div>
      {secondsLeft === 0 && (
        <p className="mt-2 text-center text-xs text-muted">Offer window closed — enroll now before seats fill.</p>
      )}
    </div>
  );
}

const included = [
  "15 days of live training",
  "7 real-world AI projects",
  "All AI tools & automation stack",
  "Verified certificate",
  "Lifetime community access",
  "Email + WhatsApp support",
];

export default function Pricing({
  course,
  timerMinutes = 0,
  timerLabel = "Hurry! Offer price expires in",
  ctaText = "Enroll Now",
}: {
  course: PublicCourse;
  timerMinutes?: number;
  timerLabel?: string;
  ctaText?: string;
}) {
  const save = discountPercent(course.price, course.offerPrice);
  const offerActive =
    course.offerPrice < course.price &&
    (!course.offerEndDate || new Date(course.offerEndDate) > new Date());
  const displayPrice = offerActive ? course.offerPrice : course.price;

  return (
    <section className="bg-navy-light/30 py-24" id="pricing">
      <div className="container-x">
        <Reveal className="text-center">
          <h2 className="section-title">Simple, Honest Pricing</h2>
          <p className="section-sub mx-auto max-w-2xl">
            One payment. Everything included. No upsells.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="relative mx-auto mt-14 max-w-md">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-cta/25 to-electric/25 blur-2xl" />
            <div className="card relative !border-gold/30 text-center">
              {offerActive && course.offerText && (
                <span className="badge mx-auto border-cta/40 bg-cta/10 font-bold text-cta">
                  <Flame size={13} /> {course.offerText}
                  {save > 0 && ` — Save ${save}%`}
                </span>
              )}
              <div className="mt-6 flex items-end justify-center gap-3">
                {offerActive && (
                  <span className="price-strike mb-1.5 text-2xl font-semibold text-muted">
                    {inr(course.price)}
                  </span>
                )}
                <span className="text-5xl font-extrabold text-white">{inr(displayPrice)}</span>
              </div>
              {offerActive && course.offerEndDate && (
                <div className="mt-2 text-xs text-muted">
                  Offer ends <b className="text-gold">{formatDate(course.offerEndDate)}</b>
                </div>
              )}

              {offerActive && <CountdownTimer minutes={timerMinutes} label={timerLabel} />}

              <ul className="mt-8 space-y-3 text-left">
                {included.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-200">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <a href="#batches" className="btn-cta mt-8 w-full text-base">
                {ctaText}
              </a>
              <p className="mt-3 text-xs text-muted">Secure payment via Razorpay • Instant receipt</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
