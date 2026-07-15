import { getPublicChatSettings, getChatProducts } from "@/lib/chatbot/context";
import { ChatWidget } from "./chat-widget";

/**
 * Server component that decides whether the chat exists at all.
 *
 * If the admin has the bot switched off, this renders nothing — no widget, no
 * chat JavaScript, no product list in the payload. The kill switch is real, not
 * cosmetic.
 *
 * Only three safe fields cross to the client: the greeting, the suggested
 * questions, and the public product list (name/tagline/slug — all already on the
 * public /products page). The system prompt never leaves the server.
 */
export async function ChatMount() {
  const settings = await getPublicChatSettings();
  if (!settings.enabled) return null;

  const products = await getChatProducts();

  return (
    <ChatWidget
      greeting={settings.greeting}
      suggestedQuestions={settings.suggestedQuestions}
      products={products.map((p) => ({ slug: p.slug, name: p.name, tagline: p.tagline }))}
    />
  );
}
