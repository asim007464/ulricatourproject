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

export async function markOrderPaid(
  orderId: string,
  update: {
    customer_name: string | null;
    customer_email: string | null;
    paypal_order_id: string;
    amount: number;
  }
) {
  const supabase = createAdminClient();
  if (!supabase) {
    console.warn("Supabase not configured — paid order not updated.");
    return false;
  }

  const { error } = await supabase
    .from("orders")
    .update({
      order_type: "paid",
      status: "paid",
      customer_name: update.customer_name,
      customer_email: update.customer_email,
      paypal_order_id: update.paypal_order_id,
      amount: update.amount,
    })
    .eq("id", orderId);

  if (error) {
    console.error("Failed to mark order paid:", error.message);
    return false;
  }

  return true;
}
