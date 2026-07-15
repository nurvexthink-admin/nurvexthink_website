// Run SQL against the Supabase project via the Management API.
//   SUPABASE_PAT=sbp_... node scripts/supabase-sql.mjs "select now();"
//   SUPABASE_PAT=sbp_... node scripts/supabase-sql.mjs supabase/migrations/0009_chatbot.sql
// The PAT is read from the env (never written to disk).
import fs from "node:fs";

const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_REF || "axbsghyqhhdaiylcksbv";
if (!PAT) {
  console.error("Missing SUPABASE_PAT env var");
  process.exit(1);
}

const arg = process.argv[2];
if (!arg) {
  console.error("Pass a .sql file path or an inline SQL string");
  process.exit(1);
}
const query = arg.endsWith(".sql") ? fs.readFileSync(arg, "utf8") : arg;

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});

const body = await res.text();
console.log("HTTP", res.status);
console.log(body.length > 3000 ? body.slice(0, 3000) + "\n...(truncated)" : body);
if (!res.ok) process.exit(1);
