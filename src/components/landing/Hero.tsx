"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

/** Animated AI particle field (spec: Hero Background — animated AI particles). */
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const N = 70;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006,
      vy: (Math.random() - 0.5) * 0.0006,
    }));

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      }
      // connecting lines
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = (pts[i].x - pts[j].x) * w;
          const dy = (pts[i].y - pts[j].y) * h;
          const d = Math.hypot(dx, dy);
          const max = 140 * devicePixelRatio;
          if (d < max) {
            ctx.strokeStyle = `rgba(59,130,246,${(0.16 * (1 - d / max)).toFixed(3)})`;
            ctx.lineWidth = devicePixelRatio;
            ctx.beginPath();
            ctx.moveTo(pts[i].x * w, pts[i].y * h);
            ctx.lineTo(pts[j].x * w, pts[j].y * h);
            ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = "rgba(148,163,184,0.55)";
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 1.6 * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

const tools = [
  { name: "ChatGPT", pos: "left-[6%] top-[22%]", cls: "float-slow" },
  { name: "Claude AI", pos: "right-[8%] top-[18%]", cls: "float-slower" },
  { name: "n8n", pos: "left-[10%] bottom-[24%]", cls: "float-slower" },
  { name: "Gemini", pos: "right-[12%] bottom-[30%]", cls: "float-slow" },
  { name: "Make", pos: "left-[30%] top-[12%]", cls: "float-slower" },
  { name: "Perplexity", pos: "right-[30%] top-[8%]", cls: "float-slow" },
];

export default function Hero({
  headline,
  subheadline,
  badge,
  ctaText = "Enroll Now",
}: {
  headline: string;
  subheadline: string;
  badge: string;
  ctaText?: string;
}) {
  return (
    <section className="hero-glow relative overflow-hidden pt-16">
      <Particles />

      {/* Floating AI tool logos (glassmorphism chips) */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        {tools.map((t) => (
          <span
            key={t.name}
            className={`glass absolute rounded-full px-4 py-1.5 text-xs font-semibold text-slate-200 ${t.pos} ${t.cls}`}
          >
            {t.name}
          </span>
        ))}
      </div>

      <div className="container-x relative flex min-h-[92vh] flex-col items-center justify-center py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="badge border-gold/30 bg-gold/10 text-gold"
        >
          <Sparkles size={13} /> {badge}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
        >
          {headline.split(" ").map((word, i) =>
            ["AI,", "AI", "Automation", "15", "Days"].includes(word) ? (
              <span key={i} className="bg-gradient-to-r from-gold to-cta bg-clip-text text-transparent">
                {word}{" "}
              </span>
            ) : (
              <span key={i}>{word} </span>
            )
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
        >
          {subheadline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <a href="#batches" className="btn-cta px-10 text-base">
            {ctaText} <ArrowRight size={18} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
