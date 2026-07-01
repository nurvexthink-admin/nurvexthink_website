"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateOrderStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("status") ?? "new");
  const status = (["new", "contacted", "closed"].includes(raw) ? raw : "new") as
    "new" | "contacted" | "closed";
  const supabase = await createServerSupabaseClient();
  await supabase.from("orders").update({ status }).eq("id", id);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
