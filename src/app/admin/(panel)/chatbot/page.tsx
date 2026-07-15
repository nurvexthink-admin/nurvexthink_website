import { ChatbotManager } from "@/components/admin/chatbot-manager";
import {
  getSettingsAdmin,
  listCompanyInfoAdmin,
  listProductsForChatbot,
  listConversationsAdmin,
  getMessagesByConversation,
  getChatbotUsage,
} from "@/lib/chatbot/admin-queries";

export const dynamic = "force-dynamic";

/** Transcripts shown in the admin list. Kept small so the page stays fast. */
const CONVERSATION_LIMIT = 30;

export default async function AdminChatbotPage() {
  const [settings, sections, products, conversationRows, usage] = await Promise.all([
    getSettingsAdmin(),
    listCompanyInfoAdmin(),
    listProductsForChatbot(),
    listConversationsAdmin(CONVERSATION_LIMIT),
    getChatbotUsage(),
  ]);

  if (!settings) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-semibold">AI Chatbot</h1>
        <p className="text-muted-foreground max-w-xl text-sm">
          The chatbot tables are not in the database yet. Apply{" "}
          <code className="text-foreground">supabase/migrations/0009_chatbot.sql</code> in the
          Supabase SQL editor, then reload this page.
        </p>
      </div>
    );
  }

  // One query for every transcript on the page, not one query per conversation.
  const messagesByConversation = await getMessagesByConversation(
    conversationRows.map((row) => row.id),
  );

  const conversations = conversationRows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    messageCount: row.message_count,
    lastMessageAt: row.last_message_at,
    messages: (messagesByConversation.get(row.id) ?? []).map((m) => ({
      role: m.role,
      content: m.content,
      createdAt: m.created_at,
    })),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold">AI Chatbot</h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              settings.enabled
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {settings.enabled ? "Live on the website" : "Hidden from visitors"}
          </span>
        </div>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Everything the chatbot knows and how it behaves is controlled here — no code changes
          needed.
        </p>
      </header>

      <ChatbotManager
        settings={settings}
        sections={sections}
        products={products}
        conversations={conversations}
        usage={usage}
      />
    </div>
  );
}
