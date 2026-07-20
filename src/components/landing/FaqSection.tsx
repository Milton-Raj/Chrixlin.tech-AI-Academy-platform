"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "@/components/Reveal";
import type { PublicFaq } from "@/lib/types";

export default function FaqSection({ faqs }: { faqs: PublicFaq[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (faqs.length === 0) return null;

  return (
    <section className="bg-navy-light/30 py-24" id="faq">
      <div className="container-x max-w-3xl">
        <Reveal className="text-center">
          <h2 className="section-title">Frequently Asked Questions</h2>
        </Reveal>

        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => {
            const open = openId === f.id;
            return (
              <Reveal key={f.id} delay={i * 0.04}>
                <div className={`card !p-0 transition ${open ? "border-electric/40" : ""}`}>
                  <button
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setOpenId(open ? null : f.id)}
                  >
                    <span className="text-sm font-semibold sm:text-base">{f.question}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-muted transition-transform ${open ? "rotate-180 text-electric" : ""}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{f.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
