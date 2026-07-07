"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction, type AuthState } from "@/app/admin/actions";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";
const initialState: AuthState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: "lg" }), "w-full")}
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function AdminLoginPage() {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <section className="relative overflow-hidden py-24">
      <div aria-hidden className="bg-grid mask-fade-y absolute inset-0" />
      <Container className="relative flex justify-center">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <Eyebrow>Admin</Eyebrow>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Sign in to NurvexThink
            </h1>
            <p className="text-muted-foreground text-sm">Manage products, blog posts, and leads.</p>
          </div>

          <form
            action={formAction}
            className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6"
          >
            {state.error ? (
              <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3.5 py-2.5 text-sm">
                {state.error}
              </p>
            ) : null}
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@nurvexthink.com"
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={fieldClass}
              />
            </label>
            <SubmitButton />
          </form>
        </div>
      </Container>
    </section>
  );
}
