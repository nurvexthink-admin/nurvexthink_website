import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Eyebrow, SectionHeading } from "@/components/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { faqs, siteConfig, stats, team, values } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteConfig.name} — a software studio that builds, publishes, and ships products, and takes custom software on demand.`,
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-border relative overflow-hidden border-b">
        <div aria-hidden className="bg-grid mask-fade-y absolute inset-0" />
        <div aria-hidden className="bg-glow absolute inset-x-0 top-0 h-96" />
        <Container className="relative py-20 sm:py-28">
          <div className="flex max-w-3xl flex-col gap-6">
            <Eyebrow>About the studio</Eyebrow>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              We build the software we&apos;d want to use.
            </h1>
            <p className="text-muted-foreground text-lg text-pretty">
              {siteConfig.name} is a small studio founded in {siteConfig.founded}. We ship our own
              products and take on custom work — the same engineers behind both, which keeps us
              honest about what good software actually takes.
            </p>
          </div>
        </Container>
      </section>

      {/* Story */}
      <section className="py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <SectionHeading
            align="left"
            eyebrow="Our story"
            title="Software that ships, not slideware"
            className="lg:sticky lg:top-24 lg:self-start"
          />
          <div className="text-muted-foreground flex flex-col gap-5 text-base sm:text-lg">
            <p>
              Most software dies in the gap between a great idea and a shipped product. We started{" "}
              {siteConfig.name} to close that gap: build in short cycles, put working software in
              front of people early, and keep improving it after launch.
            </p>
            <p>
              Because we run our own products, we feel every rough edge our clients would — slow
              builds, confusing flows, surprise bills. That experience goes straight back into the
              custom work we do for you.
            </p>
            <p>
              We&apos;re deliberately small. You talk to the people building your software, not a
              layer of account managers, and you own everything we make for you.
            </p>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="border-border border-t py-20 sm:py-28">
        <Container className="flex flex-col gap-12">
          <SectionHeading eyebrow="What we believe" title="The principles behind every build" />
          <div className="grid gap-4 sm:grid-cols-2">
            {values.map((value, i) => (
              <div
                key={value.title}
                className="border-border bg-card flex gap-5 rounded-2xl border p-6"
              >
                <span className="text-primary font-mono text-sm">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-heading text-lg font-semibold tracking-tight">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="border-border bg-card/40 border-y">
        <Container className="grid grid-cols-2 gap-px md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 px-2 py-8 text-center">
              <span className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {s.value}
              </span>
              <span className="text-muted-foreground text-sm">{s.label}</span>
            </div>
          ))}
        </Container>
      </section>

      {/* Team */}
      <section className="py-20 sm:py-28">
        <Container className="flex flex-col gap-12">
          <SectionHeading eyebrow="The team" title="The person behind NurvexThink" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <div
                key={member.name}
                className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6"
              >
                <span className="bg-primary/10 font-heading text-primary inline-flex size-14 items-center justify-center rounded-2xl text-lg font-bold">
                  {member.initials}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-lg font-semibold tracking-tight">
                    {member.name}
                  </h3>
                  <p className="text-primary font-mono text-xs tracking-[0.12em] uppercase">
                    {member.role}
                  </p>
                </div>
                <p className="text-muted-foreground text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-border border-t py-20 sm:py-28">
        <Container className="flex flex-col gap-12">
          <SectionHeading
            align="left"
            eyebrow="FAQ"
            title="Questions, answered"
            className="max-w-xl"
          />
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.q} className="flex flex-col gap-2">
                <h3 className="font-heading text-base font-semibold tracking-tight">{faq.q}</h3>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <Container>
          <div className="border-border bg-card flex flex-col items-center gap-6 rounded-3xl border px-6 py-14 text-center">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Let&apos;s build something together
            </h2>
            <Link href="/order" className={cn(buttonVariants({ size: "lg" }), "group")}>
              Start a project
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
