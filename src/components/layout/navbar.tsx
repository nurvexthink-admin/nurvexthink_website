import Link from "next/link";
import { NAV_LINKS } from "@/lib/nav";

export function Navbar() {
  return (
    <header className="bg-brand-bg/70 sticky top-0 z-50 border-b border-white/10 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-brand-silver-2 font-[family-name:var(--font-heading)] text-xl font-bold tracking-tight"
        >
          NurvexThink
        </Link>
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-brand-muted hover:text-brand-silver-2 text-sm transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
