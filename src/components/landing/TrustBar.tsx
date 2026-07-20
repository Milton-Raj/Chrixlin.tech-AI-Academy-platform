"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

function Counter({ target, label }: { target: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3)))); // ease-out cubic
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl font-extrabold text-white sm:text-4xl">
        {value.toLocaleString("en-IN")}
        <span className="text-gold">+</span>
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

export default function TrustBar({
  stats,
}: {
  stats: { label: string; value: number }[];
}) {
  return (
    <section className="border-y border-white/5 bg-navy-light/40">
      <div className="container-x grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        {stats.map((s) => (
          <Counter key={s.label} target={s.value} label={s.label} />
        ))}
      </div>
    </section>
  );
}
