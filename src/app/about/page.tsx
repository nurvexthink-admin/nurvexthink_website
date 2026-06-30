import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PageHeading
      title="About NurvexThink"
      subtitle="A software company that builds, publishes, and ships on demand."
    />
  );
}
