import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/section-heading";
import { BlogCard } from "@/components/blog-card";
import { getPosts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes from the NurvexThink studio on how we design, build, and ship software.",
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <section className="border-border relative overflow-hidden border-b">
        <div aria-hidden className="bg-grid mask-fade-y absolute inset-0" />
        <Container className="relative py-20 sm:py-24">
          <div className="flex max-w-2xl flex-col gap-5">
            <Eyebrow>Writing</Eyebrow>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">Blog</h1>
            <p className="text-muted-foreground text-lg text-pretty">
              Notes on how we design, build, and ship — and the decisions behind the software we put
              our name on.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          {posts.length === 0 ? (
            <p className="text-muted-foreground">No posts published yet — check back soon.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
