import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import ProductEditForm from "@/components/admin/ProductEditForm";
import type { DbProduct } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="admin-card">
      <h1>Edit product</h1>
      <p className="admin-muted">{slug}</p>
      <ProductEditForm product={data as DbProduct} />
    </div>
  );
}
