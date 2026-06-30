import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Navbar } from "@/components/layout/navbar";

describe("Navbar", () => {
  it("renders the brand wordmark", () => {
    render(<Navbar />);
    expect(screen.getByText("NurvexThink")).toBeInTheDocument();
  });
  it("renders all primary nav links", () => {
    render(<Navbar />);
    for (const label of ["Products", "Blog", "Custom Order", "About", "Contact"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });
});
