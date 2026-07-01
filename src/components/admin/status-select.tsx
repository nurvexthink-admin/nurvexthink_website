"use client";

import { updateOrderStatus } from "@/app/admin/(panel)/orders/actions";

export function StatusSelect({ id, value }: { id: string; value: string }) {
  return (
    <form action={updateOrderStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="border-input bg-background text-foreground focus-visible:border-ring rounded-md border px-2 py-1 text-xs outline-none"
      >
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="closed">Closed</option>
      </select>
    </form>
  );
}
