import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductsExplorer } from "@/components/products-explorer";
import type { Product } from "@/lib/content";

const params = vi.hoisted(() => ({ value: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => params.value,
}));

function makeProduct(over: Partial<Product>): Product {
  return {
    slug: "fluxboard",
    name: "FluxBoard",
    category: "Productivity",
    tagline: "Standups into shipped work.",
    summary: "Sum",
    description: "",
    status: "Live",
    tags: [],
    year: "2026",
    liveUrl: "#",
    repoUrl: null,
    coverImage: null,
    highlights: ["One", "Two", "Three"],
    featured: true,
    ...over,
  };
}

const products = [
  makeProduct({}),
  makeProduct({
    slug: "pulse",
    name: "Pulse",
    category: "Analytics",
    tagline: "Metrics without the meetings.",
    featured: false,
  }),
];

// jsdom has no <dialog> implementation.
beforeEach(() => {
  params.value = new URLSearchParams();
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("ProductsExplorer", () => {
  it("cards are real links to the technical page", () => {
    render(<ProductsExplorer products={products} />);
    const link = screen.getAllByRole("link").find((a) =>
      a.getAttribute("href")?.endsWith("/products/fluxboard"),
    );
    expect(link).toBeTruthy();
  });

  it("clicking a card opens the quick view and pushes ?p=", () => {
    const push = vi.spyOn(window.history, "pushState");
    render(<ProductsExplorer products={products} />);
    fireEvent.click(screen.getByText("Standups into shipped work."));
    expect(screen.getByText("Full technical details")).toBeInTheDocument();
    expect(push).toHaveBeenCalled();
    expect(String(push.mock.calls[0][2])).toContain("p=fluxboard");
  });

  it("hydrates open state from ?p=", () => {
    params.value = new URLSearchParams("p=pulse");
    render(<ProductsExplorer products={products} />);
    expect(screen.getByText("Full technical details")).toBeInTheDocument();
  });

  it("silently ignores an unknown ?p= slug", () => {
    params.value = new URLSearchParams("p=not-a-product");
    render(<ProductsExplorer products={products} />);
    expect(screen.queryByText("Full technical details")).not.toBeInTheDocument();
    // The grid still renders normally.
    expect(screen.getByText("FluxBoard")).toBeInTheDocument();
  });

  it("filters by category pill", () => {
    render(<ProductsExplorer products={products} />);
    fireEvent.click(screen.getByRole("button", { name: "Analytics" }));
    expect(screen.queryByText("Standups into shipped work.")).not.toBeInTheDocument();
    expect(screen.getByText("Pulse")).toBeInTheDocument();
  });
});
