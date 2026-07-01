"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { ProductStatusRow } from "@/lib/supabase/types";
import type { ProductFormState } from "@/app/admin/(panel)/products/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(buttonVariants({ size: "lg" }))}>
      {pending ? "Saving…" : label}
    </button>
  );
}

export function ProductForm({
  product,
  action,
  submitLabel,
}: {
  product?: ProductStatusRow;
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {state.error ? (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3.5 py-2.5 text-sm">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Name
          <input name="name" required defaultValue={product?.name ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Slug
          <input
            name="slug"
            required
            defaultValue={product?.slug ?? ""}
            placeholder="lowercase-with-dashes"
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className={labelClass}>
          Category
          <input name="category" defaultValue={product?.category ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Status
          <select name="status" defaultValue={product?.status ?? "Live"} className={fieldClass}>
            <option>Live</option>
            <option>Beta</option>
            <option>Soon</option>
          </select>
        </label>
        <label className={labelClass}>
          Year
          <input name="year" defaultValue={product?.year ?? ""} className={fieldClass} />
        </label>
      </div>

      <label className={labelClass}>
        Summary
        <input name="summary" defaultValue={product?.summary ?? ""} className={fieldClass} />
      </label>

      <label className={labelClass}>
        Description
        <textarea
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          className={cn(fieldClass, "resize-y")}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Tags <span className="text-muted-foreground font-normal">(comma separated)</span>
          <input
            name="tags"
            defaultValue={(product?.tags ?? []).join(", ")}
            placeholder="Next.js, Realtime"
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Live URL
          <input name="live_url" defaultValue={product?.live_url ?? ""} className={fieldClass} />
        </label>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product?.featured ?? false}
            className="size-4"
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="published"
            defaultChecked={product?.published ?? false}
            className="size-4"
          />
          Published (visible on the site)
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Link href="/admin/products" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
