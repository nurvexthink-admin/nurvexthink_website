import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { adminCounts } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const counts = await adminCounts();

  const cards = [
    {
      href: "/admin/products",
      label: "Products",
      value: counts.products,
      hint: "Manage the catalog",
    },
    { href: "/admin/blog", label: "Blog posts", value: counts.posts, hint: "Write and publish" },
    {
      href: "/admin/orders",
      label: "Leads",
      value: counts.orders,
      hint: counts.newOrders > 0 ? `${counts.newOrders} new` : "All caught up",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Manage what appears on the public site. Changes go live immediately.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group border-border bg-card hover:border-primary/40 flex flex-col gap-2 rounded-2xl border p-6 transition-colors"
          >
            <span className="text-muted-foreground font-mono text-xs tracking-[0.14em] uppercase">
              {card.label}
            </span>
            <span className="font-heading text-4xl font-bold tracking-tight">{card.value}</span>
            <span className="text-primary mt-1 inline-flex items-center gap-1 text-sm">
              {card.hint}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
