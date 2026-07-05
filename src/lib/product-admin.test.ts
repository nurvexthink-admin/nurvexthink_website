import { describe, it, expect } from "vitest";
import {
  validatePublishTier,
  slugify,
  copySlug,
  nextSortOrder,
  sortOrderSequence,
} from "@/lib/product-admin";

const complete = {
  name: "FluxBoard",
  tagline: "Standups into shipped work.",
  summary: "A keyboard-first project board.",
  highlights: ["Fast", "Realtime", "Keyboard-first"],
  coverImage: "https://cdn.example/cover.png",
  categoryId: "11111111-1111-1111-1111-111111111111",
};

describe("validatePublishTier", () => {
  it("passes a complete quick-view tier", () => {
    expect(validatePublishTier(complete)).toEqual({ valid: true, missing: [] });
  });

  it("names every missing field, in editor order", () => {
    const check = validatePublishTier({
      name: "",
      tagline: "",
      summary: "",
      highlights: [],
      coverImage: null,
      categoryId: null,
    });
    expect(check.valid).toBe(false);
    expect(check.missing).toEqual([
      "Name",
      "Tagline",
      "Summary",
      "At least 3 highlights",
      "Cover image",
      "Category",
    ]);
  });

  it("does not count blank highlights toward the minimum of 3", () => {
    const check = validatePublishTier({ ...complete, highlights: ["Fast", "   ", "Realtime"] });
    expect(check.missing).toEqual(["At least 3 highlights"]);
  });

  it("treats whitespace-only text fields as missing", () => {
    expect(validatePublishTier({ ...complete, tagline: "  " }).missing).toEqual(["Tagline"]);
  });
});

describe("slugify", () => {
  it("lowercases and dashes non-alphanumerics", () => {
    expect(slugify("Flux Board 2.0!")).toBe("flux-board-2-0");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("  --Vault-- ")).toBe("vault");
  });
});

describe("copySlug", () => {
  it("suffixes -copy, then -copy-2, -copy-3…", () => {
    expect(copySlug("fluxboard", 1)).toBe("fluxboard-copy");
    expect(copySlug("fluxboard", 2)).toBe("fluxboard-copy-2");
    expect(copySlug("fluxboard", 3)).toBe("fluxboard-copy-3");
  });

  it("never stacks -copy when duplicating a duplicate", () => {
    expect(copySlug("fluxboard-copy", 1)).toBe("fluxboard-copy");
    expect(copySlug("fluxboard-copy", 2)).toBe("fluxboard-copy-2");
    expect(copySlug("fluxboard-copy-2", 3)).toBe("fluxboard-copy-3");
  });
});

describe("nextSortOrder", () => {
  it("starts at 10 and continues past the max in steps of 10", () => {
    expect(nextSortOrder([])).toBe(10);
    expect(nextSortOrder([10, 30, 20])).toBe(40);
  });
});

describe("sortOrderSequence", () => {
  it("yields 10, 20, 30 … for n rows", () => {
    expect(sortOrderSequence(3)).toEqual([10, 20, 30]);
    expect(sortOrderSequence(0)).toEqual([]);
  });
});
