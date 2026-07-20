import { Briefcase, Laptop, Building2, TrendingUp } from "lucide-react";
import Reveal from "@/components/Reveal";

const audiences = [
  {
    icon: Briefcase,
    title: "9-to-5 Professionals",
    problems: ["Salary growth limitations", "Job insecurity", "AI disruption"],
    outcome: "Learn future-proof AI skills that make you irreplaceable.",
  },
  {
    icon: Laptop,
    title: "Freelancers",
    problems: ["Race-to-the-bottom pricing", "Manual delivery", "Client churn"],
    outcome: "Create high-value AI services and automation solutions.",
  },
  {
    icon: Building2,
    title: "Business Owners",
    problems: ["Rising manpower costs", "Repetitive operations", "Slow scaling"],
    outcome: "Automate operations and reduce manual work dramatically.",
  },
  {
    icon: TrendingUp,
    title: "Career Growth Seekers",
    problems: ["Stuck at the same level", "Skills going stale", "No differentiation"],
    outcome: "Move from Junior → Senior → Expert with in-demand AI skills.",
  },
];

export default function Audience() {
  return (
    <section className="py-24" id="audience">
      <div className="container-x">
        <Reveal className="text-center">
          <h2 className="section-title">Who Is This For?</h2>
          <p className="section-sub mx-auto max-w-2xl">
            Built for ambitious people who refuse to be left behind by the AI wave.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a, i) => (
            <Reveal key={a.title} delay={i * 0.08}>
              <div className="card group h-full transition duration-300 hover:-translate-y-1 hover:border-electric/40">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-electric/15 text-electric transition group-hover:bg-electric group-hover:text-white">
                  <a.icon size={22} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{a.title}</h3>
                <ul className="mt-3 space-y-1.5">
                  {a.problems.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cta" />
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-white/10 pt-4 text-sm font-medium text-gold">
                  {a.outcome}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
