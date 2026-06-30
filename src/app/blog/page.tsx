import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return <PageHeading title="Blog" subtitle="Notes on what we build. Coming soon." />;
}
