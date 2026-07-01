import { listOrdersAdmin } from "@/lib/admin-queries";
import { StatusSelect } from "@/components/admin/status-select";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminOrdersPage() {
  const orders = await listOrdersAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground text-sm">
          {orders.length} project {orders.length === 1 ? "request" : "requests"} from the order form
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="border-border bg-card text-muted-foreground rounded-2xl border p-8 text-sm">
          No leads yet. Submissions from the “Start a project” form appear here.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-foreground font-medium">{order.name}</div>
                  <div className="text-muted-foreground text-sm">
                    <a href={`mailto:${order.email}`} className="hover:text-foreground">
                      {order.email}
                    </a>
                    {order.company ? ` · ${order.company}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs">
                    {formatDate(order.created_at)}
                  </span>
                  <StatusSelect id={order.id} value={order.status} />
                </div>
              </div>

              <div className="text-muted-foreground flex flex-wrap gap-2 font-mono text-xs uppercase">
                {order.project_type ? (
                  <span className="bg-muted rounded-md px-2 py-0.5">{order.project_type}</span>
                ) : null}
                {order.budget ? (
                  <span className="bg-muted rounded-md px-2 py-0.5">{order.budget}</span>
                ) : null}
              </div>

              <p className="text-foreground/90 text-sm whitespace-pre-line">{order.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
