import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { signOutAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/orders", label: "Leads" },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Backstop for the middleware guard: never expose the panel to the unauthenticated.
  if (!user) redirect("/");

  return (
    <div className="min-h-[70vh]">
      <div className="border-border bg-card/40 border-b">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-4">
          <nav className="flex flex-wrap items-center gap-1">
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-3 py-1.5 text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{user.email}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="border-border hover:text-foreground rounded-md border px-3 py-1.5 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </Container>
      </div>
      <Container className="py-10">{children}</Container>
    </div>
  );
}
