"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { verifyTurnstile } from "@/lib/turnstile";

export type OrderState =
  { status: "idle" } | { status: "success" } | { status: "error"; message: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Per-IP throttle: at most this many lead submissions per window.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MIN = 10;
// Only used to avoid storing raw IPs in the rate-limit table (not a real secret).
const IP_HASH_SALT = "nurvexthink-order-rl";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  return createHash("sha256").update(IP_HASH_SALT + ip).digest("hex");
}

/**
 * Records this submission and returns true if the IP is over the limit.
 * Fails OPEN (returns false) on any DB error — Turnstile is the primary gate,
 * so a rate-limit hiccup must not block a real customer.
 */
async function isRateLimited(
  supabase: ReturnType<typeof createServiceRoleClient>,
  ipHash: string,
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MIN * 60_000).toISOString();
    const { count, error } = await supabase
      .from("order_rate_limit")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if (error) return false;
    if ((count ?? 0) >= RATE_LIMIT_MAX) return true;

    await supabase.from("order_rate_limit").insert({ ip_hash: ipHash });
    // Opportunistic cleanup keeps the table tiny (only the recent window matters).
    const cutoff = new Date(Date.now() - 60 * 60_000).toISOString();
    await supabase.from("order_rate_limit").delete().lt("created_at", cutoff);
    return false;
  } catch {
    return false;
  }
}

export async function submitOrder(_prev: OrderState, formData: FormData): Promise<OrderState> {
  // Honeypot: bots fill hidden fields. Pretend success without saving.
  if (field(formData, "website")) {
    return { status: "success" };
  }

  const name = field(formData, "name");
  const email = field(formData, "email");
  const details = field(formData, "details");
  const company = field(formData, "company") || null;
  const projectType = field(formData, "projectType") || null;
  const budget = field(formData, "budget") || null;

  if (!name || name.length > 200) {
    return { status: "error", message: "Please enter your name." };
  }
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  if (!details || details.length > 5000) {
    return { status: "error", message: "Please tell us a little about what you want to build." };
  }

  // Proof-of-humanity: the browser widget supplies this token; bots hitting the
  // endpoint directly won't have a valid one.
  const ipHash = await clientIpHash();
  const token = field(formData, "cf-turnstile-response");
  const human = await verifyTurnstile(token);
  if (!human) {
    return {
      status: "error",
      message: "Please complete the verification below and try again.",
    };
  }

  try {
    // Service-role write: the orders table no longer accepts anonymous inserts,
    // so this verified server action is the only path in.
    const supabase = createServiceRoleClient();

    if (await isRateLimited(supabase, ipHash)) {
      return {
        status: "error",
        message: "You've sent a few requests already — please try again in a little while.",
      };
    }

    const { error } = await supabase
      .from("orders")
      .insert({ name, email, details, company, project_type: projectType, budget });

    if (error) {
      return {
        status: "error",
        message: "We couldn't save your request just now. Please email us instead.",
      };
    }
    return { status: "success" };
  } catch {
    // Thrown when the service-role env var isn't set (e.g. local dev without it).
    return {
      status: "error",
      message: "Submissions aren't connected yet — please email us directly for now.",
    };
  }
}
