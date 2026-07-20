import { Star, PlayCircle } from "lucide-react";
import Reveal from "@/components/Reveal";
import type { PublicTestimonial } from "@/lib/types";

export default function Testimonials({ testimonials }: { testimonials: PublicTestimonial[] }) {
  if (testimonials.length === 0) return null;
  return (
    <section className="py-24" id="testimonials">
      <div className="container-x">
        <Reveal className="text-center">
          <h2 className="section-title">What Our Students Say</h2>
          <p className="section-sub mx-auto max-w-2xl">Real outcomes from real students.</p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={(i % 4) * 0.08}>
              <div className="card flex h-full flex-col !p-5">
                <div className="flex gap-0.5 text-gold">
                  {Array.from({ length: Math.min(t.rating, 5) }).map((_, s) => (
                    <Star key={s} size={14} fill="currentColor" />
                  ))}
                </div>

                {t.type === "VIDEO" && t.videoUrl ? (
                  <a
                    href={t.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center gap-2 rounded-lg bg-electric/10 p-3 text-sm font-medium text-electric hover:bg-electric/20"
                  >
                    <PlayCircle size={18} /> Watch video testimonial
                  </a>
                ) : null}

                {t.content && (
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-300">
                    &ldquo;{t.content}&rdquo;
                  </p>
                )}

                <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
                  {t.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.imageUrl}
                      alt={t.name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-electric to-gold text-xs font-bold text-navy">
                      {t.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    {t.role && <div className="text-xs text-muted">{t.role}</div>}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
