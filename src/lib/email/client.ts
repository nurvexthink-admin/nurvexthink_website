import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

/**
 * Email sending via ZeptoMail (Zoho's transactional service) over SMTP.
 *
 * All config comes from env so nothing sensitive is ever in the repo:
 *   ZEPTOMAIL_SMTP_HOST   default smtp.zeptomail.com
 *   ZEPTOMAIL_SMTP_PORT   default 465
 *   ZEPTOMAIL_SMTP_USER   default "emailapikey" (ZeptoMail's fixed SMTP username)
 *   ZEPTOMAIL_SMTP_PASS   the Send-Mail token (SECRET — the only value that matters)
 *   EMAIL_FROM            e.g. 'NurvexThink <nth@nurvexthink.com>'
 *   EMAIL_TO              where lead alerts are delivered
 *   EMAIL_REPLY_TO        where customer replies should land
 *
 * The transporter is created lazily and cached per server instance, so we do not
 * open a new SMTP connection on every send.
 */

const DEFAULTS = {
  host: "smtp.zeptomail.com",
  port: 465,
  user: "emailapikey",
} as const;

export type EmailConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
  replyTo: string;
};

/** Reads and validates config. Returns null (never throws) when unconfigured. */
export function getEmailConfig(): EmailConfig | null {
  const pass = process.env.ZEPTOMAIL_SMTP_PASS;
  const from = process.env.EMAIL_FROM;
  const to = process.env.EMAIL_TO;

  // Without a password there is nothing to authenticate with; without from/to
  // there is nobody to send as or to. Any of these missing => email is simply off.
  if (!pass || !from || !to) return null;

  return {
    host: process.env.ZEPTOMAIL_SMTP_HOST || DEFAULTS.host,
    port: Number(process.env.ZEPTOMAIL_SMTP_PORT) || DEFAULTS.port,
    user: process.env.ZEPTOMAIL_SMTP_USER || DEFAULTS.user,
    pass,
    from,
    to,
    replyTo: process.env.EMAIL_REPLY_TO || to,
  };
}

let cached: Transporter | null = null;

function getTransporter(config: EmailConfig): Transporter {
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    // 465 => implicit TLS; any other port => STARTTLS is negotiated.
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
    // ZeptoMail only accepts TLS 1.2+.
    tls: { minVersion: "TLSv1.2" },
  });
  return cached;
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Sends one email. Returns a result object instead of throwing, so callers can
 * decide what to do — the order flow, for instance, ignores failures so a lead
 * is never lost because email was down.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const config = getEmailConfig();
  if (!config) return { ok: false, error: "email-not-configured" };

  try {
    const transporter = getTransporter(config);
    const info = await transporter.sendMail({
      from: config.from,
      to: input.to,
      replyTo: input.replyTo ?? config.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true, id: info.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown-error";
    console.error("[email] send failed:", message);
    return { ok: false, error: message };
  }
}
