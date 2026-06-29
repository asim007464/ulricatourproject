import { createAdminClient } from "@/lib/supabase/admin";
import type { ContactMessageInsert } from "@/lib/supabase/types";

export async function saveContactMessage(message: ContactMessageInsert) {
  const supabase = createAdminClient();
  if (!supabase) {
    console.warn("Supabase not configured — contact message not saved.");
    return null;
  }

  const { data, error } = await supabase
    .from("contact_messages")
    .insert(message)
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save contact message:", error.message);
    return null;
  }

  return data.id as string;
}
