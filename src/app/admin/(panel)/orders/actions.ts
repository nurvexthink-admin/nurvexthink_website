"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type RecipientsResult = { ok: boolean; error: string | null };

/**
 * Saves the internal lead-alert recipient list. Validates and de-duplicates the
 * addresses so a typo can't silently break notifications. An empty list is
 * allowed and means "fall back to the EMAIL_TO env default".
 */
export async function saveLeadRecipients(emails: string[]): Promise<RecipientsResult> {
  const cleaned: string[] = [];
  for (const raw of emails) {
    const email = raw.trim();
    if (!email) continue;
    if (email.length > 320 || !EMAIL_RE.test(email)) {
      return { ok: false, error: `"${email}" is not a valid email address.` };
    }
    if (!cleaned.includes(email)) cleaned.push(email);
  }
  if (cleaned.length > 20) {
    return { ok: false, error: "That's a lot of recipients — please keep it to 20 or fewer." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has expired — sign in again." };

  const { error } = await supabase
    .from("notification_settings")
    .upsert({ id: 1, lead_recipients: cleaned });

  if (error) {
    return {
      ok: false,
      error:
        error.code === "42P01"
          ? "Apply migration 0010 first (the notification_settings table is missing)."
          : error.message,
    };
  }

  revalidatePath("/admin/orders");
  return { ok: true, error: null };
}

export async function updateOrderStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("status") ?? "new");
  const status = (["new", "contacted", "closed"].includes(raw) ? raw : "new") as
    "new" | "contacted" | "closed";
  const supabase = await createServerSupabaseClient();
  // Defence-in-depth: confirm a live admin session before writing (RLS also enforces).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  await supabase.from("orders").update({ status }).eq("id", id);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
