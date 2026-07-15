/**
 * HTML + plain-text email templates for the order flow.
 *
 * SECURITY: every value here comes from a public form, so all of it is
 * HTML-escaped before it touches the markup. Without this, a `details` field
 * containing `<img onerror=...>` or broken tags would corrupt the email or
 * inject content into the team's inbox. `escapeHtml` is the boundary; the
 * templates never interpolate a raw value.
 *
 * Layout is old-school table + inline styles on purpose — that is the only thing
 * that renders consistently across Gmail, Outlook, Apple Mail, etc.
 */

export type OrderEmailData = {
  name: string;
  email: string;
  company: string | null;
  projectType: string | null;
  budget: string | null;
  details: string;
};

export type RenderedEmail = { subject: string; html: string; text: string };

const LOGO_URL = "https://www.nurvexthink.com/logo.jpeg";
const SITE = "https://www.nurvexthink.com";

const BRAND_BG = "#0a0a0b";
const INK = "#1a1a1c";
const MUTED = "#6b7280";
const INDIGO = "#5c7cfa";
const BORDER = "#e5e7eb";

/** Escapes the five characters that matter for HTML text and attributes. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escapes, then turns newlines into <br> — for multi-line fields like `details`. */
function escapeMultiline(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

/** Shared shell: dark header with the logo, white card body, footer. */
function shell(bodyHtml: string, preheader: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${BORDER};">
      <tr>
        <td style="background:${BRAND_BG};padding:22px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <img src="${LOGO_URL}" width="40" height="40" alt="NurvexThink" style="display:block;border-radius:8px;">
              </td>
              <td style="vertical-align:middle;padding-left:12px;">
                <span style="font-family:'Segoe UI',Arial,sans-serif;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">NurvexThink</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="padding:28px;font-family:'Segoe UI',Arial,sans-serif;color:${INK};">
        ${bodyHtml}
      </td></tr>
      <tr>
        <td style="padding:18px 28px;border-top:1px solid ${BORDER};font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:${MUTED};">
          NurvexThink — software, built and published ·
          <a href="${SITE}" style="color:${INDIGO};text-decoration:none;">nurvexthink.com</a>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** One label/value row in the details table. Skips empty optional fields. */
function detailRow(label: string, value: string | null): string {
  if (!value) return "";
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:${MUTED};width:120px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;font-size:14px;color:${INK};vertical-align:top;">${escapeMultiline(value)}</td>
  </tr>`;
}

/** Email 1 — sent to the team the moment a lead arrives. */
export function renderTeamAlertEmail(order: OrderEmailData): RenderedEmail {
  const subject = `New project request from ${order.name}`;

  const body = `
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;">New project request</h1>
    <p style="margin:0 0 20px;font-size:14px;color:${MUTED};">Someone just submitted the custom-order form.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BORDER};">
      ${detailRow("Name", order.name)}
      ${detailRow("Email", order.email)}
      ${detailRow("Company", order.company)}
      ${detailRow("Project", order.projectType)}
      ${detailRow("Budget", order.budget)}
      ${detailRow("Details", order.details)}
    </table>
    <p style="margin:24px 0 0;">
      <a href="mailto:${escapeHtml(order.email)}" style="display:inline-block;background:${INDIGO};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;">Reply to ${escapeHtml(order.name)}</a>
    </p>`;

  const text = [
    "New project request",
    "",
    `Name: ${order.name}`,
    `Email: ${order.email}`,
    order.company ? `Company: ${order.company}` : "",
    order.projectType ? `Project: ${order.projectType}` : "",
    order.budget ? `Budget: ${order.budget}` : "",
    "",
    "Details:",
    order.details,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject, html: shell(body, `New request from ${order.name}`), text };
}

/** Email 2 — the confirmation the customer receives. */
export function renderCustomerReplyEmail(order: OrderEmailData): RenderedEmail {
  const subject = "We got your request — NurvexThink";
  const firstName = order.name.split(" ")[0] || order.name;

  const body = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;">Thanks, ${escapeHtml(firstName)} 👋</h1>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      We&#39;ve received your project request and a real person on our team will read it and get back to you, usually within one business day.
    </p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      Here&#39;s a copy of what you sent us:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:10px;background:#fafafa;padding:4px 16px;">
      ${detailRow("Project", order.projectType)}
      ${detailRow("Budget", order.budget)}
      ${detailRow("Details", order.details)}
    </table>
    <p style="margin:20px 0 0;font-size:15px;line-height:1.6;">
      In the meantime, feel free to explore what we&#39;ve built at
      <a href="${SITE}/products" style="color:${INDIGO};text-decoration:none;">our products</a>.
    </p>
    <p style="margin:18px 0 0;font-size:14px;color:${MUTED};">— The NurvexThink team</p>`;

  const text = [
    `Thanks, ${firstName}`,
    "",
    "We've received your project request and will get back to you, usually within one business day.",
    "",
    "A copy of what you sent:",
    order.projectType ? `Project: ${order.projectType}` : "",
    order.budget ? `Budget: ${order.budget}` : "",
    "",
    order.details,
    "",
    `Explore what we've built: ${SITE}/products`,
    "",
    "— The NurvexThink team",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject, html: shell(body, "We received your request and will reply soon."), text };
}
