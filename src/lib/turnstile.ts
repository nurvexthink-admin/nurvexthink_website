const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Server-side verification of a Cloudflare Turnstile token.
 *
 * Fails CLOSED: a missing token or missing secret returns false, so a
 * misconfiguration blocks submissions rather than silently letting spam through.
 * The public order form is protected by this + the removal of the direct anon
 * INSERT path, so a bot without a valid human token cannot create a lead.
 */
export async function verifyTurnstile(token: string, remoteip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteip) body.set("remoteip", remoteip);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
