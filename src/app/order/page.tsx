import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/section-heading";
import { OrderForm } from "@/components/order-form";
import { getProductBySlug } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Start a project",
  description:
    "Request custom software from NurvexThink. Tell us the problem and we'll send a plan.",
};

const expectations = [
  "A reply within one business day",
  "A short scope with milestones before any code",
  "A live preview link early — watch it take shape",
  "You own everything we build for you",
];

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const refProduct = ref ? await getProductBySlug(ref) : null;
  const defaultDetails = refProduct ? `I'd like something like ${refProduct.name} — ` : "";

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div aria-hidden className="bg-grid mask-fade-y absolute inset-0" />
      <Container className="relative grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <Eyebrow>Custom software on demand</Eyebrow>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Tell us what you need built.
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            Share the problem and a few details. We&apos;ll come back with a plan, a timeline, and a
            preview link you can watch take shape.
          </p>
          <ul className="mt-2 flex flex-col gap-3">
            {expectations.map((item) => (
              <li key={item} className="text-muted-foreground flex items-start gap-3 text-sm">
                <span className="bg-primary/10 text-primary mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full">
                  <Check className="size-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <OrderForm defaultDetails={defaultDetails} />
      </Container>
    </section>
  );
}
