import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy py-10">
      <div className="container-x flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div>
          <div className="text-lg font-bold">
            Chrixlin<span className="text-gold">.tech</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Premium AI Academy — Master AI, Automation & Digital Growth.
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted">
          <a href="#batches" className="hover:text-white">Enroll</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
          <a href="#contact" className="hover:text-white">Contact</a>
          <Link href="/admin/login" className="hover:text-white">Admin</Link>
        </div>
        <p className="text-xs text-muted">© {new Date().getFullYear()} Chrixlin.tech. All rights reserved.</p>
      </div>
    </footer>
  );
}
