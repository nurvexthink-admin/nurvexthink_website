"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { BlogPostRow } from "@/lib/supabase/types";
import type { PostFormState } from "@/app/admin/(panel)/blog/actions";
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

export function PostForm({
  post,
  action,
  submitLabel,
}: {
  post?: BlogPostRow;
  action: (prev: PostFormState, formData: FormData) => Promise<PostFormState>;
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

      <input type="hidden" name="existing_published_at" value={post?.published_at ?? ""} />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Title
          <input name="title" required defaultValue={post?.title ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Slug
          <input
            name="slug"
            required
            defaultValue={post?.slug ?? ""}
            placeholder="lowercase-with-dashes"
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className={labelClass}>
          Category
          <input name="category" defaultValue={post?.category ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Author
          <input name="author_name" defaultValue={post?.author_name ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Reading time
          <input
            name="reading_time"
            defaultValue={post?.reading_time ?? ""}
            placeholder="4 min"
            className={fieldClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        Excerpt
        <input name="excerpt" defaultValue={post?.excerpt ?? ""} className={fieldClass} />
      </label>

      <label className={labelClass}>
        Content{" "}
        <span className="text-muted-foreground font-normal">(blank line between paragraphs)</span>
        <textarea
          name="content"
          rows={12}
          defaultValue={post?.content ?? ""}
          className={cn(fieldClass, "resize-y")}
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="status"
          value="published"
          defaultChecked={post?.status === "published"}
          className="size-4"
        />
        Published (visible on the site)
      </label>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Link href="/admin/blog" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
