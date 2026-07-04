import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SocialMarquee } from "@/components/social-marquee";
import { siteConfig } from "@/lib/content";

describe("SocialMarquee", () => {
  it("renders every social link exactly once for accessibility (duplicate group hidden)", () => {
    render(<SocialMarquee />);
    for (const social of siteConfig.socials) {
      // Case-sensitive prefix: the accessible name is label+handle with no space
      // in jsdom, and "X" must not match the "x" inside every @nurvexthink handle.
      const links = screen.getAllByRole("link", { name: new RegExp(`^${social.label}`) });
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute("href", social.href);
      expect(links[0]).toHaveAttribute("target", "_blank");
      expect(links[0]).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }
  });

  it("duplicates the strip in the DOM so the CSS loop is seamless", () => {
    const { container } = render(<SocialMarquee />);
    const track = container.querySelector(".marquee-track");
    expect(track).toBeInTheDocument();
    expect(track!.children).toHaveLength(2);
    expect(track!.children[1]).toHaveAttribute("aria-hidden", "true");
  });

  it("links to the real NurvexThink profiles", () => {
    render(<SocialMarquee />);
    const hrefs = siteConfig.socials.map((s) => s.href);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "https://www.instagram.com/nurvexthink/",
        "https://x.com/nurvexthink",
        "https://www.youtube.com/channel/UCUttTw2GdvnD8XkaFqTbARQ",
        "https://www.tiktok.com/@nurvexthink8",
        "https://github.com/nurvexthink",
      ]),
    );
  });
});
