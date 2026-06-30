import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { getPostBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return { title: post.title, description: post.excerpt };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="py-16 sm:py-24">
      <Container className="flex max-w-2xl flex-col gap-8">
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          All posts
        </Link>

        <header className="flex flex-col gap-4">
          <div className="text-muted-foreground flex items-center gap-3 font-mono text-xs tracking-[0.14em] uppercase">
            <span className="text-primary">{post.category}</span>
            {post.readingTime ? (
              <>
                <span aria-hidden>·</span>
                <span>{post.readingTime}</span>
              </>
            ) : null}
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {post.title}
          </h1>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span>{post.author}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </div>
        </header>

        <div className="flex flex-col gap-5">
          {post.excerpt ? (
            <p className="text-foreground/90 text-lg leading-relaxed text-pretty">{post.excerpt}</p>
          ) : null}
          {post.content.map((paragraph, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </Container>
    </article>
  );
}
