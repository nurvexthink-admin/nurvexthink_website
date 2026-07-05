import type { MetadataRoute } from "next";
import { getProducts, getPosts } from "@/lib/queries";

const BASE = "https://nurvexthink-website.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts] = await Promise.all([getProducts(), getPosts()]);

  const staticRoutes = ["", "/products", "/blog", "/about", "/contact", "/order"].map(
    (path) => ({ url: `${BASE}${path}`, lastModified: new Date() }),
  );

  return [
    ...staticRoutes,
    ...products.map((p) => ({ url: `${BASE}/products/${p.slug}`, lastModified: new Date() })),
    ...posts.map((p) => ({ url: `${BASE}/blog/${p.slug}`, lastModified: new Date() })),
  ];
}
