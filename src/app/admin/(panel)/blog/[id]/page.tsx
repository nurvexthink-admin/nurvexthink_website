import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPostAdmin } from "@/lib/admin-queries";
import { PostForm } from "@/components/admin/post-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { deletePost, updatePost } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostAdmin(id);
  if (!post) notFound();

  const action = updatePost.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/blog"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Blog
      </Link>
      <h1 className="font-heading text-2xl font-bold tracking-tight">Edit post</h1>

      <PostForm post={post} action={action} submitLabel="Save changes" />

      <div className="border-border max-w-2xl border-t pt-6">
        <form action={deletePost}>
          <input type="hidden" name="id" value={post.id} />
          <ConfirmSubmit
            message={`Delete "${post.title}"? This cannot be undone.`}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            Delete post
          </ConfirmSubmit>
        </form>
      </div>
    </div>
  );
}
