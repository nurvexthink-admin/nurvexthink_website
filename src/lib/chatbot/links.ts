/**
 * Turns the internal links the model mentions into structured cards/CTAs.
 *
 * The model is told (in the system prompt) to reference real pages like
 * `/products/shoppal`. Rather than trusting it to emit JSON — which small models
 * do unreliably — we scan the finished text for paths we already know exist and
 * render a card for each. A hallucinated slug simply matches nothing and no card
 * appears, so a wrong link can never be shown to a customer.
 *
 * Pure functions only: no DB, no secrets. Unit-tested in links.test.ts.
 */

export type ChatCard =
  | { kind: "product"; slug: string; name: string; tagline: string; href: string }
  | { kind: "order" }
  | { kind: "contact" };

export type KnownProduct = { slug: string; name: string; tagline: string };

/** Matches an internal path in the reply, with or without surrounding markdown. */
const PRODUCT_PATH = /\/products\/([a-z0-9][a-z0-9-]*)/gi;
const ORDER_PATH = /\/order\b/i;
const CONTACT_PATH = /\/contact\b/i;

const MAX_PRODUCT_CARDS = 3;

/**
 * Extracts cards from an assistant reply.
 * Only slugs present in `known` are returned — that is the anti-hallucination gate.
 */
export function extractCards(reply: string, known: KnownProduct[]): ChatCard[] {
  const cards: ChatCard[] = [];
  const seen = new Set<string>();

  const bySlug = new Map(known.map((p) => [p.slug.toLowerCase(), p]));

  for (const match of reply.matchAll(PRODUCT_PATH)) {
    const slug = match[1].toLowerCase();
    if (seen.has(slug)) continue;
    const product = bySlug.get(slug);
    if (!product) continue; // hallucinated or unpublished -> no card
    seen.add(slug);
    cards.push({
      kind: "product",
      slug: product.slug,
      name: product.name,
      tagline: product.tagline,
      href: `/products/${product.slug}`,
    });
    if (cards.length >= MAX_PRODUCT_CARDS) break;
  }

  if (ORDER_PATH.test(reply)) cards.push({ kind: "order" });
  if (CONTACT_PATH.test(reply)) cards.push({ kind: "contact" });

  return cards;
}

/**
 * Strips the raw paths out of the prose once they are rendered as cards, so the
 * customer does not read "visit /products/shoppal" above a button that says the
 * same thing. Markdown links are collapsed to their label.
 */
export function cleanReplyText(reply: string): string {
  return reply
    // [Label](/products/x) -> Label
    .replace(/\[([^\]]+)\]\((\/[^)]*)\)/g, "$1")
    // bare paths left in prose
    .replace(/\(?\/(?:products\/[a-z0-9-]+|products|order|contact|blog)\)?/gi, "")
    // tidy the punctuation left behind
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([.,!?])/g, "$1")
    .trim();
}
