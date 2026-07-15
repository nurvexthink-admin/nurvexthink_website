"use client";

import { useState, useTransition } from "react";
import { fieldClass } from "@/components/admin/form-styles";
import { saveLeadRecipients } from "@/app/admin/(panel)/orders/actions";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Editor for who receives the internal "new lead" alert email.
 * `initial === null` means the notification_settings table isn't migrated yet.
 */
export function LeadRecipientsEditor({ initial }: { initial: string[] | null }) {
  const [recipients, setRecipients] = useState<string[]>(initial ?? []);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const notMigrated = initial === null;

  function add() {
    const email = input.trim();
    if (!email) return;
    if (!EMAIL_RE.test(email)) {
      setMessage({ ok: false, text: `"${email}" is not a valid email.` });
      return;
    }
    if (recipients.includes(email)) {
      setMessage({ ok: false, text: "That address is already on the list." });
      setInput("");
      return;
    }
    setRecipients((list) => [...list, email]);
    setInput("");
    setMessage(null);
  }

  function remove(email: string) {
    setRecipients((list) => list.filter((e) => e !== email));
    setMessage(null);
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveLeadRecipients(recipients);
      setMessage(
        result.ok
          ? { ok: true, text: "Saved. New leads will notify these addresses." }
          : { ok: false, text: result.error ?? "Could not save." },
      );
    });
  }

  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
      <div>
        <h2 className="text-foreground font-medium">Lead alert recipients</h2>
        <p className="text-muted-foreground text-sm">
          Who gets the “new project request” email. Not shown to the customer — they always get
          their own confirmation.
        </p>
      </div>

      {notMigrated ? (
        <p className="text-destructive text-sm">
          Apply <code className="text-foreground">migration 0010</code> to enable this.
        </p>
      ) : (
        <>
          {recipients.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No recipients set — alerts fall back to the default <code>EMAIL_TO</code> address.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {recipients.map((email) => (
                <li
                  key={email}
                  className="border-border bg-muted/40 flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => remove(email)}
                    aria-label={`Remove ${email}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="email"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder="add-another@nurvexthink.com"
              className={`${fieldClass} max-w-xs`}
            />
            <button
              type="button"
              onClick={add}
              className="border-border hover:bg-muted rounded-md border px-3 py-2 text-sm"
            >
              Add
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      )}

      {message && (
        <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-destructive"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
