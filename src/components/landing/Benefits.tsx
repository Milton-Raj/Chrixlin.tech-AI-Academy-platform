"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  Brain,
  Gem,
  Search,
  Workflow,
  Blocks,
  Bot,
  PenTool,
  Zap,
  Mic,
  Building,
} from "lucide-react";
import Reveal from "@/components/Reveal";

const skills = [
  { icon: MessageSquare, name: "ChatGPT", desc: "Prompting mastery & GPT workflows" },
  { icon: Brain, name: "Claude AI", desc: "Advanced reasoning & long-form work" },
  { icon: Gem, name: "Gemini AI", desc: "Multimodal AI for daily productivity" },
  { icon: Search, name: "Perplexity", desc: "AI-powered research at speed" },
  { icon: Workflow, name: "n8n", desc: "Open-source workflow automation" },
  { icon: Blocks, name: "Make", desc: "No-code automation scenarios" },
  { icon: Bot, name: "AI Agents", desc: "Autonomous agents that do real work" },
  { icon: PenTool, name: "AI Content Creation", desc: "Content engines that scale" },
  { icon: Zap, name: "AI Automation", desc: "End-to-end automated systems" },
  { icon: Mic, name: "Voice AI", desc: "Voice agents & call automation" },
  { icon: Building, name: "Business Automation", desc: "Automate ops, sales & support" },
];

export default function Benefits() {
  return (
    <section className="bg-navy-light/30 py-24" id="benefits">
      <div className="container-x">
        <Reveal className="text-center">
          <h2 className="section-title">Everything You Will Master</h2>
          <p className="section-sub mx-auto max-w-2xl">
            The complete modern AI stack — tools, systems and workflows used by top operators.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {skills.map((s, i) => (
            <Reveal key={s.name} delay={(i % 4) * 0.06}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="card group flex h-full items-start gap-4 !p-5 hover:border-gold/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold transition group-hover:bg-gold group-hover:text-navy">
                  <s.icon size={20} />
                </div>
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="mt-0.5 text-sm text-muted">{s.desc}</div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
