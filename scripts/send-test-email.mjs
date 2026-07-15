// Quick manual check that ZeptoMail SMTP is working. Reads .env.local.
//   node scripts/send-test-email.mjs
// Sends one plain test email to EMAIL_TO and prints the server response.
import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

const env = {};
for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const port = Number(env.ZEPTOMAIL_SMTP_PORT);
const transporter = nodemailer.createTransport({
  host: env.ZEPTOMAIL_SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: env.ZEPTOMAIL_SMTP_USER, pass: env.ZEPTOMAIL_SMTP_PASS },
  tls: { minVersion: "TLSv1.2" },
});

await transporter.verify();
console.log("SMTP connection + credentials OK");

const info = await transporter.sendMail({
  from: env.EMAIL_FROM,
  to: env.EMAIL_TO,
  replyTo: env.EMAIL_REPLY_TO,
  subject: "NurvexThink email test",
  text: "Live test from the NurvexThink email system. ZeptoMail is working.",
  html: '<div style="font-family:Segoe UI,Arial,sans-serif;padding:20px"><h2>It works ✅</h2><p>Live test from the NurvexThink email system.</p></div>',
});
console.log("Sent:", info.response);
