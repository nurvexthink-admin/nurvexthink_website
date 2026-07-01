import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostForm } from "@/components/admin/post-form";
import { createPost } from "../actions";

export const dynamic = "force-dynamic";

export default function NewPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/blog"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Blog
      </Link>
      <h1 className="font-heading text-2xl font-bold tracking-tight">New post</h1>
      <PostForm action={createPost} submitLabel="Create post" />
    </div>
  );
}
