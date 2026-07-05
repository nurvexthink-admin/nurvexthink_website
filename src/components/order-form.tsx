"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { submitOrder, type OrderState } from "@/app/order/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/content";

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";
const initialState: OrderState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: "lg" }), "group w-full sm:w-auto")}
    >
      {pending ? "Sending…" : "Send project details"}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

export function OrderForm({ defaultDetails = "" }: { defaultDetails?: string }) {
  const [state, formAction] = useActionState(submitOrder, initialState);

  if (state.status === "success") {
    return (
      <div className="border-border bg-card flex flex-col items-start gap-3 rounded-2xl border p-8">
        <CheckCircle2 className="text-primary size-8" />
        <h3 className="font-heading text-xl font-semibold tracking-tight">Request received</h3>
        <p className="text-muted-foreground text-sm">
          Thanks — we&apos;ve got your details and will reply within a business day. Prefer to write
          directly? Reach us at{" "}
          <a className="text-primary hover:underline" href={`mailto:${siteConfig.email}`}>
            {siteConfig.email}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="border-border bg-card flex flex-col gap-5 rounded-2xl border p-6 sm:p-8"
    >
      {state.status === "error" ? (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3.5 py-2.5 text-sm">
          {state.message}
        </p>
      ) : null}

      {/* Honeypot — hidden from real users, catches bots. */}
      <div aria-hidden className="hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Name
          <input name="name" required placeholder="Your name" className={fieldClass} />
        </label>
        <label className={labelClass}>
          Email
          <input
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className={fieldClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        Company <span className="text-muted-foreground font-normal">(optional)</span>
        <input name="company" placeholder="Company or project name" className={fieldClass} />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Project type
          <select name="projectType" defaultValue="Web app" className={fieldClass}>
            <option>Web app</option>
            <option>Mobile app</option>
            <option>AI feature</option>
            <option>Internal tool</option>
            <option>Something else</option>
          </select>
        </label>
        <label className={labelClass}>
          Budget
          <select name="budget" defaultValue="Not sure yet" className={fieldClass}>
            <option>Not sure yet</option>
            <option>Under $5k</option>
            <option>$5k – $15k</option>
            <option>$15k – $40k</option>
            <option>$40k+</option>
          </select>
        </label>
      </div>

      <label className={labelClass}>
        What do you want to build?
        <textarea
          name="details"
          required
          rows={5}
          defaultValue={defaultDetails}
          placeholder="A sentence or two about the problem, who it's for, and any deadline."
          className={cn(fieldClass, "resize-y")}
        />
      </label>

      <SubmitButton />
    </form>
  );
}
