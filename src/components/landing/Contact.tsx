"use client";

import { useState } from "react";
import { MessageCircle, Mail, Send, CheckCircle2 } from "lucide-react";
import { LinkedinIcon, InstagramIcon, YoutubeIcon, XIcon } from "@/components/icons/social";
import Reveal from "@/components/Reveal";

export default function Contact({
  whatsapp,
  email,
  socials,
}: {
  whatsapp: string;
  email: string;
  socials: { linkedin: string; instagram: string; youtube: string; twitter: string };
}) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  const waLink = `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`;
  const socialLinks = [
    { icon: LinkedinIcon, href: socials.linkedin, label: "LinkedIn" },
    { icon: InstagramIcon, href: socials.instagram, label: "Instagram" },
    { icon: YoutubeIcon, href: socials.youtube, label: "YouTube" },
    { icon: XIcon, href: socials.twitter, label: "X / Twitter" },
  ].filter((s) => s.href);

  return (
    <section className="py-24" id="contact">
      <div className="container-x grid gap-12 lg:grid-cols-2">
        <Reveal>
          <h2 className="section-title">Questions? Talk to Us</h2>
          <p className="section-sub max-w-md">
            We reply fast. Reach us on WhatsApp for the quickest answer, or drop a message using the form.
          </p>

          <div className="mt-8 space-y-4">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="card flex items-center gap-4 !p-4 transition hover:border-green-400/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/15 text-green-400">
                <MessageCircle size={20} />
              </span>
              <div>
                <div className="text-sm font-semibold">WhatsApp</div>
                <div className="text-xs text-muted">{whatsapp}</div>
              </div>
            </a>
            <a
              href={`mailto:${email}`}
              className="card flex items-center gap-4 !p-4 transition hover:border-electric/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-electric/15 text-electric">
                <Mail size={20} />
              </span>
              <div>
                <div className="text-sm font-semibold">Email</div>
                <div className="text-xs text-muted">{email}</div>
              </div>
            </a>
            {socialLinks.length > 0 && (
              <div className="flex gap-3 pt-2">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-muted transition hover:border-gold/50 hover:text-gold"
                  >
                    <s.icon size={18} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {status === "sent" ? (
            <div className="card flex h-full flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 size={44} className="text-green-400" />
              <h3 className="mt-4 text-xl font-semibold">Message received!</h3>
              <p className="mt-2 text-sm text-muted">We&apos;ll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="card space-y-4">
              <div>
                <label className="label">Your Name</label>
                <input
                  className="input"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea
                  className="input min-h-28"
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="How can we help?"
                />
              </div>
              {status === "error" && (
                <p className="text-xs text-red-400">Something went wrong — please try again.</p>
              )}
              <button className="btn-cta w-full" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : "Send Message"} <Send size={16} />
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
