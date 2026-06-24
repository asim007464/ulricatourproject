import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="admin-card">
        <h1>Pages</h1>
        <p className="admin-error">
          Add Supabase keys to <code>.env.local</code> to manage pages.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: pages, error } = await supabase
    .from("site_pages")
    .select("slug, title, hero_title")
    .order("title");

  return (
    <div className="admin-card">
      <h1>Pages</h1>
      <p className="admin-muted">
        Edit the Book Taxi and Book Tour listing pages shown on the website.
      </p>

      {error ? <p className="admin-error">Could not load pages.</p> : null}

      {!pages?.length ? (
        <p className="admin-muted">
          No pages in database yet. Run <code>npm run seed:supabase</code>.
        </p>
      ) : (
        <div className="admin-product-list">
          {pages.map((page) => (
            <div key={page.slug} className="admin-product-item">
              <div>
                <strong>{page.title}</strong>
                <div className="admin-muted">
                  /{page.slug === "taxi-booking" ? "taxi-booking" : page.slug}/
                  {page.hero_title ? ` · ${page.hero_title}` : ""}
                </div>
              </div>
              <Link href={`/admin/pages/${page.slug}`}>Edit</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
