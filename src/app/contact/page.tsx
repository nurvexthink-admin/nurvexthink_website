import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return <PageHeading title="Contact" subtitle="Reach the NurvexThink team." />;
}
