"use client";

import { useEffect, useState } from "react";

/**
 * Per-visitor evergreen countdown shared by the hero strip and the pricing
 * card. The deadline is stored in the visitor's browser under one key, so both
 * timers on the page always show the same number, and each customer gets their
 * own window that restarts on a later visit. Admin sets the minutes in CMS.
 */
const DEADLINE_KEY = "chx_offer_deadline";

export function useOfferCountdown(minutes: number): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (minutes <= 0) return;
    let deadline = Number(localStorage.getItem(DEADLINE_KEY) ?? 0);
    if (!deadline || deadline <= Date.now()) {
      deadline = Date.now() + minutes * 60_000;
      localStorage.setItem(DEADLINE_KEY, String(deadline));
    }
    const tick = () => setSecondsLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [minutes]);

  return secondsLeft;
}

export function splitTime(totalSeconds: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    hours: pad(Math.floor(totalSeconds / 3600)),
    minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
    seconds: pad(totalSeconds % 60),
    showHours: totalSeconds >= 3600,
  };
}
