import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import SitePageEditForm from "@/components/admin/SitePageEditForm";
import type { DbSitePage } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AdminPageEditPage({
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
    .from("site_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="admin-card">
      <h1>Edit page</h1>
      <p className="admin-muted">{slug}</p>
      <SitePageEditForm page={data as DbSitePage} />
    </div>
  );
}
