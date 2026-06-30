import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "Custom Order" };

export default function OrderPage() {
  return (
    <PageHeading
      title="Request custom software"
      subtitle="Tell us what you need. Form coming soon."
    />
  );
}
