import { describe, it, expect } from "vitest";
import { extractCards, cleanReplyText, type KnownProduct } from "./links";

const KNOWN: KnownProduct[] = [
  { slug: "shoppal", name: "ShopPal AI", tagline: "AI shopping assistant" },
  { slug: "codeforge", name: "CodeForge", tagline: "Judge and run code" },
];

describe("extractCards", () => {
  it("makes a product card for a real slug the bot mentioned", () => {
    const cards = extractCards("You might like /products/shoppal for that.", KNOWN);
    expect(cards).toEqual([
      {
        kind: "product",
        slug: "shoppal",
        name: "ShopPal AI",
        tagline: "AI shopping assistant",
        href: "/products/shoppal",
      },
    ]);
  });

  it("IGNORES a hallucinated product slug (the anti-hallucination gate)", () => {
    const cards = extractCards("Try /products/totally-made-up for that.", KNOWN);
    expect(cards).toEqual([]);
  });

  it("does not duplicate a product mentioned twice", () => {
    const cards = extractCards("/products/shoppal is great. See /products/shoppal.", KNOWN);
    expect(cards.filter((c) => c.kind === "product")).toHaveLength(1);
  });

  it("caps product cards at three", () => {
    const many: KnownProduct[] = [
      ...KNOWN,
      { slug: "a", name: "A", tagline: "" },
      { slug: "b", name: "B", tagline: "" },
    ];
    const reply = "/products/shoppal /products/codeforge /products/a /products/b";
    expect(extractCards(reply, many).filter((c) => c.kind === "product")).toHaveLength(3);
  });

  it("adds an order CTA when the bot points at the custom-order form", () => {
    const cards = extractCards("You can start a custom order at /order.", KNOWN);
    expect(cards).toContainEqual({ kind: "order" });
  });

  it("adds a contact CTA when the bot points at the contact page", () => {
    const cards = extractCards("Reach the team via /contact.", KNOWN);
    expect(cards).toContainEqual({ kind: "contact" });
  });

  it("matches slugs case-insensitively but returns the canonical slug", () => {
    const cards = extractCards("see /products/ShopPal", KNOWN);
    expect(cards[0]).toMatchObject({ kind: "product", slug: "shoppal" });
  });

  it("returns nothing for a reply with no links", () => {
    expect(extractCards("We build custom software.", KNOWN)).toEqual([]);
  });
});

describe("cleanReplyText", () => {
  it("collapses a markdown link to its label", () => {
    expect(cleanReplyText("Try [ShopPal AI](/products/shoppal) today.")).toBe(
      "Try ShopPal AI today.",
    );
  });

  it("removes a bare path that is now shown as a card", () => {
    expect(cleanReplyText("Start here: /order")).toBe("Start here:");
  });

  it("leaves ordinary prose untouched", () => {
    const text = "We build custom web and mobile apps for startups.";
    expect(cleanReplyText(text)).toBe(text);
  });

  it("does not leave a space before punctuation", () => {
    expect(cleanReplyText("See /products/shoppal .")).not.toContain(" .");
  });
});
