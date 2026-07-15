"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-2.5">
      <span className="ring-border relative size-9 overflow-hidden rounded-lg ring-1">
        <Image src="/logo.jpeg" alt="NurvexThink logo" fill sizes="36px" className="object-cover" />
      </span>
      <span className="font-heading text-lg font-bold tracking-tight">NurvexThink</span>
    </Link>
  );
}

/**
 * `chatEnabled` comes from the server (the admin's on/off switch). While the bot
 * is off the /chat page 404s, so the tab must not exist — showing a link to a
 * dead page is worse than showing no link.
 */
export function Navbar({ chatEnabled = false }: { chatEnabled?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const links = chatEnabled
    ? [...NAV_LINKS, { href: "/chat", label: "AI Assistant" }]
    : NAV_LINKS;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors",
        scrolled
          ? "border-border bg-background/80 backdrop-blur"
          : "bg-background/0 border-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Brand />

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/order"
            className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
          >
            Start a project
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="border-border text-muted-foreground hover:text-foreground inline-flex size-9 items-center justify-center rounded-full border transition-colors md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-border bg-background/95 border-t backdrop-blur md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground block rounded-md px-3 py-2.5 text-sm transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/order"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ size: "sm" }), "w-full")}
              >
                Start a project
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
