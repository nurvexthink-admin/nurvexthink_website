import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/nav";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/content";

const resources = [
  { href: "/products", label: "Products" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border border-t">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="ring-border relative size-9 overflow-hidden rounded-lg ring-1">
                <Image
                  src="/logo.jpeg"
                  alt="NurvexThink logo"
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </span>
              <span className="font-heading text-lg font-bold tracking-tight">NurvexThink</span>
            </Link>
            <p className="text-muted-foreground max-w-xs text-sm">{siteConfig.description}</p>
          </div>

          <FooterColumn title="Explore" links={NAV_LINKS} />
          <FooterColumn title="Company" links={resources} />

          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
              Connect
            </p>
            {siteConfig.socials.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {s.label}
              </Link>
            ))}
            <Link
              href={`mailto:${siteConfig.email}`}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {siteConfig.email}
            </Link>
          </div>
        </div>

        <div className="border-border text-muted-foreground mt-12 flex flex-col items-start justify-between gap-3 border-t pt-6 text-sm sm:flex-row sm:items-center">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <p className="font-mono text-xs">{siteConfig.tagline}</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">{title}</p>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
