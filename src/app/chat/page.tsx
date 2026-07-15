import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ChatPanel } from "@/components/chat/chat-panel";
import { getPublicChatSettings, getChatProducts } from "@/lib/chatbot/context";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Assistant — NurvexThink",
  description:
    "Ask about NurvexThink's products, our custom software process, or describe a project and get pointed in the right direction.",
};

export default async function ChatPage() {
  const settings = await getPublicChatSettings();
  // When the bot is off the page must not exist — a 404 is honest, an empty
  // chat box is not.
  if (!settings.enabled) notFound();

  const products = await getChatProducts();

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <h1 className="font-heading text-3xl font-semibold sm:text-4xl">AI Assistant</h1>
          <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
            Ask about what we build, browse our products, or describe your idea — the assistant will
            point you to the right product or help you start a custom order.
          </p>
        </header>

        <div className="border-border bg-brand-surface/40 overflow-hidden rounded-2xl border backdrop-blur">
          <ChatPanel
            greeting={settings.greeting}
            suggestedQuestions={settings.suggestedQuestions}
            products={products.map((p) => ({ slug: p.slug, name: p.name, tagline: p.tagline }))}
            variant="page"
          />
        </div>

        <p className="text-muted-foreground text-xs">
          The assistant can make mistakes. For anything important,{" "}
          <Link href="/contact" className="underline underline-offset-4">
            contact the team
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}
