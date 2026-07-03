import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { AmbientBackground } from "@/components/ambient-background";

const pathname = vi.hoisted(() => ({ value: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
}));

// The 3D watermark is WebGL — stub the lazy scene out under jsdom.
vi.mock("next/dynamic", () => ({
  default: () => {
    const Stub = () => <div data-testid="ambient-3d" />;
    return Stub;
  },
}));

describe("AmbientBackground", () => {
  beforeEach(() => {
    pathname.value = "/";
    // jsdom has no matchMedia; the parallax effect reads it on mount.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
  });

  it("renders a decorative, non-interactive layer on public pages", () => {
    const { container } = render(<AmbientBackground />);
    const layer = container.querySelector(".ambient-root");
    expect(layer).toBeInTheDocument();
    expect(layer).toHaveAttribute("aria-hidden");
  });

  it("renders the 3D logo watermark inside its wrapper", () => {
    const { container, getByTestId } = render(<AmbientBackground />);
    expect(container.querySelector(".ambient-logo")).toBeInTheDocument();
    expect(getByTestId("ambient-3d")).toBeInTheDocument();
  });

  it("renders nothing on admin pages", () => {
    pathname.value = "/admin/products";
    const { container } = render(<AmbientBackground />);
    expect(container).toBeEmptyDOMElement();
  });
});
