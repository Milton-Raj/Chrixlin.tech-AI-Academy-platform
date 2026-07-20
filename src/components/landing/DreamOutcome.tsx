import {
  Rocket,
  Globe,
  Settings,
  Gauge,
  Wallet,
  Lightbulb,
} from "lucide-react";
import Reveal from "@/components/Reveal";

const outcomes = [
  { icon: Rocket, title: "Career Growth", desc: "Promotions and roles that demand AI fluency — stand out in every interview." },
  { icon: Globe, title: "Freelancing", desc: "Sell AI and automation services to clients worldwide at premium rates." },
  { icon: Settings, title: "Business Automation", desc: "Run lean operations where systems, not people, do the repetitive work." },
  { icon: Gauge, title: "10x Productivity", desc: "Compress a week of manual work into an afternoon with AI workflows." },
  { icon: Wallet, title: "Additional Income", desc: "Open new income streams — products, services and automations that earn." },
  { icon: Lightbulb, title: "AI Consulting", desc: "Advise businesses on AI adoption and get paid for your expertise." },
];

export default function DreamOutcome() {
  return (
    <section className="py-24">
      <div className="container-x">
        <Reveal className="text-center">
          <h2 className="section-title">
            Where Could You Be In The Next{" "}
            <span className="bg-gradient-to-r from-gold to-cta bg-clip-text text-transparent">12 Months?</span>
          </h2>
          <p className="section-sub mx-auto max-w-2xl">
            Students use these exact skills to unlock outcomes like these.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {outcomes.map((o, i) => (
            <Reveal key={o.title} delay={(i % 3) * 0.08}>
              <div className="card h-full transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-cta/20 text-gold">
                  <o.icon size={22} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{o.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{o.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
