import { notFound } from "next/navigation";
import type { Metadata } from "next";

// The secret admin-login gate. The path segment must equal ADMIN_SLUG (a
// server-only env secret, never committed, set in Vercel + .env.local). Any
// other value — or a missing env var — renders a normal 404, so the login
// page is unreachable and undiscoverable without knowing the exact URL.
export const dynamic = "force-dynamic";

// Never index the secret path (defence in depth; nothing links to it anyway).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function GateLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ gate: string }>;
}) {
  const { gate } = await params;
  const slug = process.env.ADMIN_SLUG;
  if (!slug || gate !== slug) notFound();
  return <>{children}</>;
}
