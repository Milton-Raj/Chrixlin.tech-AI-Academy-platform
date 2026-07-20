"use client";

import { Flame, TimerReset } from "lucide-react";
import { inr, discountPercent } from "@/lib/format";
import { useOfferCountdown, splitTime } from "@/components/landing/offer";

function Digits({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="min-w-9 rounded-md border border-cta/40 bg-navy/80 px-1.5 py-1 font-mono text-lg font-bold leading-none text-cta sm:min-w-10 sm:text-xl">
        {value}
      </span>
      <span className="mt-1 text-[9px] uppercase tracking-wider text-muted">{label}</span>
    </div>
  );
}

/**
 * Compact price + countdown strip shown directly under the hero CTA, so the
 * offer and its deadline are visible the moment the page loads on any device.
 */
export default function HeroOffer({
  price,
  offerPrice,
  offerText,
  timerMinutes,
  timerLabel,
}: {
  price: number;
  offerPrice: number;
  offerText: string;
  timerMinutes: number;
  timerLabel: string;
}) {
  const secondsLeft = useOfferCountdown(timerMinutes);
  const discounted = offerPrice < price;
  const save = discountPercent(price, offerPrice);
  const t = secondsLeft === null ? null : splitTime(secondsLeft);

  return (
    <div className="glass mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-2xl px-5 py-4 sm:flex-row sm:justify-center sm:gap-6">
      {/* Price */}
      <div className="flex items-baseline gap-2.5">
        {discounted && (
          <span className="price-strike text-base font-semibold text-muted">{inr(price)}</span>
        )}
        <span className="text-3xl font-extrabold text-white">{inr(discounted ? offerPrice : price)}</span>
        {save > 0 && (
          <span className="rounded-full bg-cta/15 px-2 py-0.5 text-[10px] font-bold uppercase text-cta">
            Save {save}%
          </span>
        )}
      </div>

      {/* Countdown */}
      {timerMinutes > 0 && (
        <>
          <span className="hidden h-10 w-px bg-white/15 sm:block" />
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-cta">
              {secondsLeft === 0 ? <Flame size={11} /> : <TimerReset size={11} />}
              {secondsLeft === 0 ? "Last chance — seats going fast" : timerLabel}
            </span>
            <div className="mt-1.5 flex items-start gap-1.5">
              {t ? (
                <>
                  {t.showHours && (
                    <>
                      <Digits value={t.hours} label="hrs" />
                      <span className="pt-1 text-lg font-bold text-muted">:</span>
                    </>
                  )}
                  <Digits value={t.minutes} label="min" />
                  <span className="pt-1 text-lg font-bold text-muted">:</span>
                  <Digits value={t.seconds} label="sec" />
                </>
              ) : (
                // Placeholder keeps the layout stable until the timer mounts
                <>
                  <Digits value="--" label="min" />
                  <span className="pt-1 text-lg font-bold text-muted">:</span>
                  <Digits value="--" label="sec" />
                </>
              )}
            </div>
          </div>
        </>
      )}

      {offerText && timerMinutes <= 0 && (
        <span className="text-xs font-semibold text-gold">{offerText}</span>
      )}
    </div>
  );
}
