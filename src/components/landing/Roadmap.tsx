"use client";

import { motion } from "framer-motion";
import { BookOpen, Cog, Briefcase } from "lucide-react";
import Reveal from "@/components/Reveal";

const phases = [
  {
    icon: BookOpen,
    days: "Day 1–5",
    title: "AI Foundations",
    points: ["ChatGPT, Claude, Gemini & Perplexity mastery", "Prompt engineering frameworks", "AI-first productivity systems"],
  },
  {
    icon: Cog,
    days: "Day 6–10",
    title: "Automation Systems",
    points: ["n8n & Make hands-on workflows", "AI Agents that act autonomously", "Connecting apps, data & AI"],
  },
  {
    icon: Briefcase,
    days: "Day 11–15",
    title: "Real Business Projects",
    points: ["Build 7 real-world AI projects", "Business workflow automation", "Certification & career playbook"],
  },
];

export default function Roadmap() {
  return (
    <section className="bg-navy-light/30 py-24" id="curriculum">
      <div className="container-x">
        <Reveal className="text-center">
          <h2 className="section-title">Your 15-Day Roadmap</h2>
          <p className="section-sub mx-auto max-w-2xl">
            A structured sprint from beginner to certified AI automation practitioner.
          </p>
        </Reveal>

        <div className="relative mt-16">
          {/* animated progress line (desktop) */}
          <div className="absolute left-0 right-0 top-7 hidden h-0.5 bg-white/10 lg:block">
            <motion.div
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-electric via-gold to-cta"
            />
          </div>

          <div className="grid gap-10 lg:grid-cols-3">
            {phases.map((ph, i) => (
              <Reveal key={ph.title} delay={i * 0.2}>
                <div className="relative">
                  <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 bg-navy text-gold shadow-lg shadow-gold/10 lg:mx-0">
                    <ph.icon size={24} />
                  </div>
                  <div className="card mt-6 h-full">
                    <div className="text-xs font-bold uppercase tracking-wider text-cta">{ph.days}</div>
                    <h3 className="mt-1 text-xl font-semibold">{ph.title}</h3>
                    <ul className="mt-4 space-y-2">
                      {ph.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2 text-sm text-muted">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-electric" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
