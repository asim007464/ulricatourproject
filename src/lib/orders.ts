import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderInsert } from "@/lib/supabase/types";

export async function saveOrder(order: OrderInsert) {
  const supabase = createAdminClient();
  if (!supabase) {
    console.warn("Supabase not configured — order not saved to database.");
    return null;
  }

  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save order:", error.message);
    return null;
  }

  return data.id as string;
}
