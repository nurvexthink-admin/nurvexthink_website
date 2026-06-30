import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return <PageHeading title="Products" subtitle="Software we build and publish. Coming soon." />;
}
