import {
  Bot,
  MessageCircle,
  FileText,
  Mic,
  Magnet,
  Headphones,
  GitBranch,
} from "lucide-react";
import Reveal from "@/components/Reveal";

const projects = [
  { icon: Bot, name: "AI Chatbot", desc: "A trained chatbot for any website or business" },
  { icon: MessageCircle, name: "WhatsApp Automation", desc: "Auto-replies, follow-ups and broadcasts" },
  { icon: FileText, name: "AI Content Generator", desc: "A content engine for blogs & social media" },
  { icon: Mic, name: "AI Voice Agent", desc: "A voice assistant that talks to customers" },
  { icon: Magnet, name: "AI Lead Generation System", desc: "Capture, qualify and route leads on autopilot" },
  { icon: Headphones, name: "AI Customer Support Agent", desc: "24/7 support that resolves real tickets" },
  { icon: GitBranch, name: "Business Workflow Automation", desc: "End-to-end ops automation with n8n / Make" },
];

export default function Projects() {
  return (
    <section className="py-24" id="projects">
      <div className="container-x">
        <Reveal className="text-center">
          <h2 className="section-title">Projects You Will Build</h2>
          <p className="section-sub mx-auto max-w-2xl">
            Not theory — you leave with a portfolio of working AI systems.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((pr, i) => (
            <Reveal key={pr.name} delay={(i % 3) * 0.07}>
              <div className="card group flex h-full items-center gap-4 !p-5 transition hover:border-electric/40">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-electric/15 text-electric transition group-hover:scale-110">
                  <pr.icon size={22} />
                </div>
                <div>
                  <div className="font-semibold">{pr.name}</div>
                  <div className="mt-0.5 text-sm text-muted">{pr.desc}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
