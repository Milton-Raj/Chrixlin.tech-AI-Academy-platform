"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  Video,
  BadgeCheck,
  IndianRupee,
  FileEdit,
  LogOut,
  ExternalLink,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/batches", label: "Batches", icon: Layers },
  { href: "/admin/meetings", label: "Meetings", icon: Video },
  { href: "/admin/certificates", label: "Certificates", icon: BadgeCheck },
  { href: "/admin/pricing", label: "Pricing", icon: IndianRupee },
  { href: "/admin/cms", label: "CMS", icon: FileEdit },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-white/10 bg-navy-light/50 py-5 lg:w-56">
      <Link href="/admin" className="px-3 text-center text-lg font-bold lg:px-5 lg:text-left">
        <span className="hidden lg:inline">
          Chrixlin<span className="text-gold">.tech</span>
        </span>
        <span className="lg:hidden text-gold">C</span>
      </Link>
      <div className="mt-1 hidden px-5 text-[10px] uppercase tracking-widest text-muted lg:block">
        Admin Portal
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-2 lg:px-3">
        {nav.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-electric/15 text-electric"
                  : "text-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={18} className="shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 px-2 lg:px-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={18} className="shrink-0" />
          <span className="hidden lg:inline">View Site</span>
        </Link>
        <button
          onClick={logout}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={18} className="shrink-0" />
          <span className="hidden lg:inline">Logout</span>
        </button>
      </div>
    </aside>
  );
}
