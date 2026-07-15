import "server-only";

import { sendEmail, getEmailConfig } from "./client";
import { getLeadRecipients } from "./recipients";
import { renderTeamAlertEmail, renderCustomerReplyEmail, type OrderEmailData } from "./templates";

/**
 * Fires the two order emails: an alert to the team and a confirmation to the
 * customer.
 *
 * This is called from `after()` in the order action, so it runs AFTER the
 * customer already saw "thanks, we got it". Two consequences, both deliberate:
 *   1. It must never throw — a crash here would surface as an unhandled rejection.
 *   2. A failure must be swallowed and logged, never shown to the user. The lead
 *      is already safely in the database; a bounced notification email is a
 *      problem for us to notice in logs, not the customer's problem.
 *
 * The team alert and the customer reply are independent — one failing must not
 * stop the other — so they are sent concurrently and their results logged apart.
 */
export async function sendOrderEmails(order: OrderEmailData): Promise<void> {
  // If email isn't configured (e.g. local dev without the key), do nothing
  // rather than log a scary error for every submission.
  if (!getEmailConfig()) return;

  const teamAlert = renderTeamAlertEmail(order);
  const customerReply = renderCustomerReplyEmail(order);

  const config = getEmailConfig();
  // Admin-editable list, falling back to EMAIL_TO. This is the internal alert's
  // recipients only — never the customer.
  const teamRecipients = await getLeadRecipients(config?.to ?? "");

  const results = await Promise.allSettled([
    teamRecipients.length > 0
      ? sendEmail({
          to: teamRecipients.join(", "),
          subject: teamAlert.subject,
          html: teamAlert.html,
          text: teamAlert.text,
          // Let the team hit reply and reach the customer directly.
          replyTo: order.email,
        })
      : Promise.resolve({ ok: false as const, error: "no-team-recipient" }),
    sendEmail({
      to: order.email,
      subject: customerReply.subject,
      html: customerReply.html,
      text: customerReply.text,
    }),
  ]);

  const [team, customer] = results;
  if (team.status === "rejected" || (team.status === "fulfilled" && !team.value.ok)) {
    const reason =
      team.status === "rejected" ? String(team.reason) : team.value.ok ? "" : team.value.error;
    console.error("[email] team alert failed:", reason);
  }
  if (customer.status === "rejected" || (customer.status === "fulfilled" && !customer.value.ok)) {
    const reason =
      customer.status === "rejected"
        ? String(customer.reason)
        : customer.value.ok
          ? ""
          : customer.value.error;
    console.error("[email] customer reply failed:", reason);
  }
}
