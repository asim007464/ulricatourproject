import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import AdminPageTitle from "@/components/admin/AdminPageTitle";
import { PagesIcon } from "@/components/admin/AdminIcons";

export const dynamic = "force-dynamic";

function pagePath(slug: string) {
  return slug === "taxi-booking" ? "/taxi-booking" : `/${slug}`;
}

function pageTypeLabel(slug: string) {
  return slug === "taxi-booking" ? "Taxi listing" : "Tours listing";
}

function pageTypeBadgeClass(slug: string) {
  return slug === "taxi-booking"
    ? "admin-badge admin-badge-taxi"
    : "admin-badge admin-badge-tour";
}

export default async function AdminPagesPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="admin-card">
        <AdminPageTitle icon={<PagesIcon />}>Pages</AdminPageTitle>
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
      <AdminPageTitle icon={<PagesIcon />}>Pages</AdminPageTitle>
      <p className="admin-muted admin-page-intro">
        Edit the Book Taxi and Book Tour listing pages shown on the website.
      </p>

      {error ? <p className="admin-error">Could not load pages.</p> : null}

      {!pages?.length ? (
        <div className="admin-empty-state">
          <p className="admin-empty-state__title">No pages yet</p>
          <p className="admin-muted">
            Run <code>npm run seed:supabase</code> to create the listing pages.
          </p>
        </div>
      ) : (
        <div className="admin-page-table">
          <div className="admin-page-table__head" aria-hidden="true">
            <span>Page</span>
            <span>URL</span>
            <span>Hero heading</span>
            <span>Actions</span>
          </div>

          <div className="admin-page-list">
            {pages.map((page) => {
              const path = pagePath(page.slug);

              return (
                <article key={page.slug} className="admin-page-row">
                  <div className="admin-page-row__main">
                    <strong>{page.title}</strong>
                    <div className="admin-page-row__meta">
                      <span className={pageTypeBadgeClass(page.slug)}>
                        {pageTypeLabel(page.slug)}
                      </span>
                      <span className="admin-page-row__slug">{page.slug}</span>
                    </div>
                  </div>

                  <div className="admin-page-row__url">
                    <span className="admin-page-row__label">URL</span>
                    <code>{path}</code>
                  </div>

                  <div className="admin-page-row__hero">
                    <span className="admin-page-row__label">Hero heading</span>
                    <span className="admin-page-row__hero-text">
                      {page.hero_title || "—"}
                    </span>
                  </div>

                  <div className="admin-page-row__actions">
                    <Link
                      href={`/admin/pages/${page.slug}`}
                      className="admin-btn admin-btn-small admin-btn-secondary"
                    >
                      Edit
                    </Link>
                    <Link
                      href={path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-small admin-btn-ghost"
                    >
                      View
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
