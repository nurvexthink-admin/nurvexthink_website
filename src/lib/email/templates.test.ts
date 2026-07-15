import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  renderTeamAlertEmail,
  renderCustomerReplyEmail,
  type OrderEmailData,
} from "./templates";

const BASE: OrderEmailData = {
  name: "Ali Khan",
  email: "ali@example.com",
  company: "Acme",
  projectType: "Mobile app",
  budget: "$2,000",
  details: "I want an app for my shop.",
};

describe("escapeHtml", () => {
  it("escapes all five HTML-significant characters", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });
  it("leaves ordinary text untouched", () => {
    expect(escapeHtml("Hello world 123")).toBe("Hello world 123");
  });
});

describe("renderTeamAlertEmail", () => {
  it("includes the lead's real details", () => {
    const { html, text, subject } = renderTeamAlertEmail(BASE);
    expect(subject).toContain("Ali Khan");
    expect(html).toContain("ali@example.com");
    expect(html).toContain("Mobile app");
    expect(text).toContain("I want an app for my shop.");
  });

  it("NEVER emits raw user HTML (injection guard)", () => {
    const evil = renderTeamAlertEmail({
      ...BASE,
      name: '<script>alert(1)</script>',
      details: '<img src=x onerror="steal()">',
    });
    expect(evil.html).not.toContain("<script>");
    expect(evil.html).not.toContain("<img src=x");
    expect(evil.html).toContain("&lt;script&gt;");
    expect(evil.html).toContain("&lt;img");
  });

  it("hides optional fields when they're empty", () => {
    const { html } = renderTeamAlertEmail({ ...BASE, company: null, budget: null });
    expect(html).not.toContain("Company");
    expect(html).not.toContain("Budget");
    expect(html).toContain("Project"); // present ones still show
  });

  it("turns newlines in details into <br>", () => {
    const { html } = renderTeamAlertEmail({ ...BASE, details: "line one\nline two" });
    expect(html).toContain("line one<br>line two");
  });
});

describe("renderCustomerReplyEmail", () => {
  it("greets by first name only", () => {
    const { html } = renderCustomerReplyEmail(BASE);
    expect(html).toContain("Ali");
  });

  it("escapes the name in the greeting (injection via the name field)", () => {
    const { html } = renderCustomerReplyEmail({ ...BASE, name: "<b>x</b>" });
    expect(html).not.toContain("<b>x</b>");
    expect(html).toContain("&lt;b&gt;x");
  });

  it("does not leak the internal team email address to the customer", () => {
    const { html, text } = renderCustomerReplyEmail(BASE);
    expect(html).not.toContain("nth@nurvexthink.com");
    expect(text).not.toContain("nth@nurvexthink.com");
  });

  it("produces a non-empty plain-text alternative", () => {
    const { text } = renderCustomerReplyEmail(BASE);
    expect(text.length).toBeGreaterThan(30);
  });
});
