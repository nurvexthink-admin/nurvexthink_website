"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChatPanel } from "./chat-panel";
import type { KnownProduct } from "@/lib/chatbot/links";

type Props = {
  greeting: string;
  suggestedQuestions: string[];
  products: KnownProduct[];
};

/**
 * The floating chat bubble, shown on every public page.
 *
 * Rendered only when the admin has switched the bot on — the server layout
 * decides that, so a disabled bot ships no widget and no chat JS runs.
 */
export function ChatWidget({ greeting, suggestedQuestions, products }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // The admin panel has its own chrome, and /chat already IS the chat.
  const hidden = pathname.startsWith("/admin") || pathname === "/chat";

  // Close on Escape, and return focus to the launcher for keyboard users.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Never trap a mobile user behind a panel they cannot scroll past.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const isSmall = window.matchMedia("(max-width: 640px)").matches;
    if (isSmall) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (hidden) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? "Close the assistant" : "Open the assistant"}
        className="border-border bg-brand-surface/90 text-foreground hover:border-brand-indigo/60 fixed right-4 bottom-4 z-50 flex size-14 items-center justify-center rounded-full border shadow-lg backdrop-blur transition-colors sm:right-6 sm:bottom-6"
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>

      {open && (
        <div
          id="chat-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="NurvexThink assistant"
          className="border-border bg-brand-bg/95 fixed z-50 flex flex-col overflow-hidden border shadow-2xl backdrop-blur-xl inset-x-0 bottom-0 top-0 sm:inset-auto sm:right-6 sm:bottom-24 sm:top-auto sm:h-[min(34rem,calc(100vh-8rem))] sm:w-[24rem] sm:rounded-2xl"
        >
          <header className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
            <span className="flex items-center gap-2">
              <span className="bg-brand-indigo size-2 rounded-full" aria-hidden />
              <span className="font-heading text-sm font-semibold">NurvexThink assistant</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              aria-label="Close the assistant"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <CloseIcon />
            </button>
          </header>

          <div className="min-h-0 flex-1">
            <ChatPanel
              greeting={greeting}
              suggestedQuestions={suggestedQuestions}
              products={products}
              variant="popover"
            />
          </div>
        </div>
      )}
    </>
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12a8 8 0 0 1-8 8H7l-4 3v-4.5A8 8 0 0 1 3 12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
