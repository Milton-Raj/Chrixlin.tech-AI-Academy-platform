import { BadgeCheck, Hash, ShieldCheck, Download, Briefcase } from "lucide-react";
import { LinkedinIcon } from "@/components/icons/social";
import Reveal from "@/components/Reveal";

const features = [
  { icon: Hash, label: "Unique Certificate Number" },
  { icon: ShieldCheck, label: "Public Verification Page" },
  { icon: Download, label: "Downloadable PDF" },
  { icon: LinkedinIcon, label: "LinkedIn Ready" },
  { icon: Briefcase, label: "Employer Friendly" },
];

export default function Certification() {
  return (
    <section className="bg-navy-light/30 py-24" id="certificate">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="badge border-gold/30 bg-gold/10 text-gold">
            <BadgeCheck size={13} /> Verified Certification
          </div>
          <h2 className="section-title mt-4">
            Become Certified by <span className="text-gold">Chrixlin.tech</span>
          </h2>
          <p className="section-sub max-w-xl">
            Complete the course and receive a verified certificate generated automatically — with a
            unique ID and a public verification link anyone can check.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-gold">
                  <f.icon size={16} />
                </span>
                {f.label}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Certificate preview — matches the light PDF design */}
        <Reveal delay={0.15}>
          <div className="relative mx-auto max-w-md rotate-1 transition duration-500 hover:rotate-0">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-gold/30 to-electric/20 blur-2xl" />
            <div className="relative rounded-2xl border-4 border-gold/80 bg-white p-7 text-center shadow-2xl">
              <div className="rounded-xl border border-gold/50 p-5">
                <div className="text-lg font-bold tracking-widest text-gold">CHRIXLIN.TECH</div>
                <div className="text-[9px] uppercase tracking-[0.35em] text-slate-400">
                  Premium AI Academy
                </div>
                <div className="mt-5 text-lg font-bold text-slate-900">CERTIFICATE OF COMPLETION</div>
                <div className="mt-3 text-[11px] text-slate-500">
                  This certificate is proudly presented to
                </div>
                <div className="mt-1.5 font-serif text-3xl italic text-gold">Your Name</div>
                <div className="mx-auto mt-2 h-px w-40 bg-gold/70" />
                <div className="mt-3 text-[11px] text-slate-500">for successfully completing</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  AI, Automation & Digital Growth Mastery
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {["ChatGPT", "Claude AI", "Gemini", "Perplexity", "n8n", "Make", "AI Agents"].map(
                    (t) => (
                      <span
                        key={t}
                        className="rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700"
                      >
                        {t}
                      </span>
                    )
                  )}
                </div>

                <div className="mt-5 flex items-end justify-between text-left">
                  <div>
                    <div className="text-[9px] text-slate-400">Certificate No.</div>
                    <div className="font-mono text-[11px] font-semibold text-slate-800">
                      CHX-2026-000001
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-serif text-sm italic text-slate-600">Signature</div>
                    <div className="h-px w-24 bg-slate-400" />
                    <div className="mt-1 text-[9px] text-slate-400">Authorized Signatory</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
