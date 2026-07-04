import Link from "next/link";
import { siteConfig } from "@/lib/content";
import { SocialIcon } from "@/components/social-icons";

/**
 * Infinite social-links marquee: one seamless strip that scrolls forever
 * (pure CSS transform animation — pauses on hover, freezes under
 * prefers-reduced-motion via the global guard). The track holds two identical
 * groups; translating -50% loops without a visible seam. The duplicate group
 * is aria-hidden and untabbable so links only appear once to a11y tools.
 */

function MarqueeGroup({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-12 pr-12 sm:gap-16 sm:pr-16"
    >
      {siteConfig.socials.map((social) => (
        <li key={social.label} className="flex items-center gap-12 sm:gap-16">
          <Link
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={hidden ? -1 : undefined}
            className="text-muted-foreground hover:text-foreground group flex items-center gap-3 transition-colors"
          >
            <SocialIcon name={social.label} className="size-5" />
            <span className="font-heading text-sm font-semibold tracking-tight whitespace-nowrap">
              {social.label}
            </span>
            <span className="font-mono text-xs whitespace-nowrap opacity-60 transition-opacity group-hover:opacity-100">
              {social.handle}
            </span>
          </Link>
          <span aria-hidden className="text-brand-muted/50 text-[0.6rem]">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SocialMarquee() {
  return (
    <section aria-label="NurvexThink on social media" className="border-border border-b py-6">
      <div className="marquee">
        <div className="marquee-track">
          <MarqueeGroup />
          <MarqueeGroup hidden />
        </div>
      </div>
    </section>
  );
}
