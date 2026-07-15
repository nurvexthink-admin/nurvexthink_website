// Proves the chatbot's AI path works with the real key + a real model.
// Uses the same AI SDK calls the /api/chat route uses.
//   node scripts/test-chatbot-ai.mjs [modelId]
import fs from "node:fs";
import path from "node:path";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const env = {};
for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const modelId = process.argv[2] || "gpt-4o-mini";
const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

const system = `You are the assistant for NurvexThink, a software studio.
Only use the COMPANY CONTEXT. Never invent products. Keep answers to 2-3 sentences.
When you mention or recommend a product, ALWAYS include its exact page path from the
context (for example /products/shoppal) in your reply — that is what gives the visitor
a clickable link. Write the path exactly, do not change it.

COMPANY CONTEXT:
## Our products (the ONLY products that exist)
- ShopPal AI (E-commerce, status: live)
  Summary: An AI assistant that helps online shoppers find products.
  Page: /products/shoppal
## Key links
- Custom order form: /order`;

console.log(`Testing model: ${modelId}`);
const t0 = Date.now();
const { text, usage } = await generateText({
  model: openai(modelId),
  system,
  prompt: "<user_message>\nI want to build an app that helps people shop online. Do you have anything like that?\n</user_message>",
  temperature: 0.3,
});
const ms = Date.now() - t0;

console.log("\n--- REPLY ---");
console.log(text);
console.log("\n--- STATS ---");
console.log(`  latency: ${ms} ms`);
console.log(`  tokens: in=${usage?.inputTokens ?? "?"} out=${usage?.outputTokens ?? "?"}`);
console.log(`  mentions ShopPal: ${/shoppal/i.test(text) ? "YES ✅" : "no"}`);
console.log(`  links to product page: ${/\/products\/shoppal/i.test(text) ? "YES ✅" : "no"}`);
