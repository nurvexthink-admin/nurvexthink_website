"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type PostFormState = { error?: string };

const SESSION_EXPIRED = "Your session has expired — sign in again.";

/** Defence-in-depth: confirm a live admin session before any write (RLS still
 *  enforces this too). */
async function currentUser(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function parseForm(formData: FormData) {
  const status = String(formData.get("status") ?? "draft") === "published" ? "published" : "draft";
  const existing = String(formData.get("existing_published_at") ?? "").trim() || null;
  return {
    slug: String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase(),
    title: String(formData.get("title") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim() || null,
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    content: String(formData.get("content") ?? "").trim() || null,
    reading_time: String(formData.get("reading_time") ?? "").trim() || null,
    author_name: String(formData.get("author_name") ?? "").trim() || null,
    status: status as "draft" | "published",
    published_at: status === "published" ? (existing ?? new Date().toISOString()) : existing,
  };
}

function revalidateAll(slug?: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/blog");
}

export async function createPost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const values = parseForm(formData);
  if (!values.title || !values.slug) return { error: "Title and slug are required." };
  const supabase = await createServerSupabaseClient();
  if (!(await currentUser(supabase))) return { error: SESSION_EXPIRED };
  const { error } = await supabase.from("blog_posts").insert(values);
  if (error) return { error: error.message };
  revalidateAll(values.slug);
  redirect("/admin/blog");
}

export async function updatePost(
  id: string,
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const values = parseForm(formData);
  if (!values.title || !values.slug) return { error: "Title and slug are required." };
  const supabase = await createServerSupabaseClient();
  if (!(await currentUser(supabase))) return { error: SESSION_EXPIRED };
  const { error } = await supabase.from("blog_posts").update(values).eq("id", id);
  if (error) return { error: error.message };
  revalidateAll(values.slug);
  redirect("/admin/blog");
}

export async function deletePost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createServerSupabaseClient();
  if (!(await currentUser(supabase))) redirect("/");
  await supabase.from("blog_posts").delete().eq("id", id);
  revalidateAll();
}
