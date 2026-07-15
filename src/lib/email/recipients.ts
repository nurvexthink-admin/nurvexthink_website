import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service";

/**
 * Who receives the internal "new lead" alert.
 *
 * Source of truth is the admin-editable `notification_settings.lead_recipients`
 * table. Falls back to the `EMAIL_TO` env var when that list is empty, the table
 * has not been migrated yet, or the read fails — so alerts are never silently
 * dropped, and the feature works before migration 0010 is applied.
 *
 * `envFallback` may hold several comma-separated addresses.
 */
export async function getLeadRecipients(envFallback: string): Promise<string[]> {
  const fallback = envFallback
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("notification_settings")
      .select("lead_recipients")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return fallback;

    const list = (data.lead_recipients ?? [])
      .map((address) => address.trim())
      .filter(Boolean);

    return list.length > 0 ? list : fallback;
  } catch {
    return fallback;
  }
}
