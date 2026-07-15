# Email (order notifications) — this repo

Transactional email via **Zoho ZeptoMail**. When someone submits the custom-order form, two
emails go out: a **lead alert** to the team and a **confirmation** to the customer.

## Setup

Add to `.env.local` (production: set the same in the host's env settings — never commit):

```
ZEPTOMAIL_SMTP_HOST=smtp.zeptomail.com
ZEPTOMAIL_SMTP_PORT=465
ZEPTOMAIL_SMTP_USER=emailapikey
ZEPTOMAIL_SMTP_PASS=<Send-Mail token from ZeptoMail → agent → SMTP/API tab>
EMAIL_FROM=NurvexThink <nth@nurvexthink.com>
EMAIL_TO=nth@nurvexthink.com
EMAIL_REPLY_TO=nth@nurvexthink.com
```

If `ZEPTOMAIL_SMTP_PASS` / `EMAIL_FROM` / `EMAIL_TO` are missing, email is **silently skipped**
and the order still saves — so local dev works without a key.

Test it: `node scripts/send-test-email.mjs` (reads `.env.local`, sends one email to `EMAIL_TO`).

## How it behaves

- Sent from the order action via **`after()`** — runs *after* the response, so a slow/failing mail
  server never delays the confirmation or loses the lead.
- Failures are **swallowed and logged**, never shown to the customer (the lead is already saved).
- All user input in the email is **HTML-escaped** (`src/lib/email/templates.ts`).

## Files

```
src/lib/email/client.ts             SMTP transporter (server-only), env-driven, never throws
src/lib/email/templates.ts          branded HTML + plain-text, user input escaped
src/lib/email/send-order-emails.ts  sends both emails concurrently, error-swallowing
src/app/order/actions.ts            after() → sendOrderEmails once the lead is saved
```

## Reusing this across other NurvexThink apps

See the portable guide: **`NurvexThink-Email-Integration-Guide.md`** (kept outside the repo, in the
workspace root). It explains adding ZeptoMail to any app, same domain or a new one.
