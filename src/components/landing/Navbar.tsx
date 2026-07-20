"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#benefits", label: "What You Learn" },
  { href: "#curriculum", label: "Curriculum" },
  { href: "#projects", label: "Projects" },
  { href: "#batches", label: "Batches" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar({ ctaText = "Enroll Now" }: { ctaText?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="glass border-x-0 border-t-0">
        <div className="container-x flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Chrixlin<span className="text-gold">.tech</span>
            <span className="ml-2 hidden rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold sm:inline">
              AI Academy
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-muted transition hover:text-white">
                {l.label}
              </a>
            ))}
            <a href="#batches" className="btn-cta !px-4 !py-2 text-sm">
              {ctaText}
            </a>
          </nav>

          <button
            className="text-white md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <nav className="border-t border-white/10 px-4 pb-4 md:hidden">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2.5 text-sm text-muted hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <a href="#batches" onClick={() => setOpen(false)} className="btn-cta mt-2 w-full text-sm">
              {ctaText}
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
