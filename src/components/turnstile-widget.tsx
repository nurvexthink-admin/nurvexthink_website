"use client";

import Script from "next/script";

/**
 * Cloudflare Turnstile widget. Rendered inside the order <form>; on success the
 * Turnstile script injects a hidden `cf-turnstile-response` input into the form,
 * which the server action reads and verifies. If the site key isn't configured
 * the widget is omitted (the server still fails closed).
 */
export function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-theme="auto"
        data-size="flexible"
      />
    </>
  );
}
