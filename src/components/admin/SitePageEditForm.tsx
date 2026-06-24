"use client";

import { useState } from "react";
import { updateSitePageAction } from "@/app/admin/actions";
import type { DbSitePage } from "@/lib/supabase/types";

type SitePageEditFormProps = {
  page: DbSitePage;
};

export default function SitePageEditForm({ page }: SitePageEditFormProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="admin-form"
      action={async (formData) => {
        setMessage("");
        setError("");
        const result = await updateSitePageAction(formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        setMessage("Page updated successfully.");
      }}
    >
      {error ? <p className="admin-error">{error}</p> : null}
      {message ? <p className="admin-success">{message}</p> : null}

      <input type="hidden" name="slug" value={page.slug} />

      <label>
        Admin label
        <input type="text" name="title" defaultValue={page.title} required />
      </label>

      <label>
        Hero heading
        <input
          type="text"
          name="hero_title"
          defaultValue={page.hero_title || ""}
        />
      </label>

      <label>
        Hero description
        <textarea
          name="hero_description"
          defaultValue={page.hero_description || ""}
        />
      </label>

      <label>
        Full page content (HTML)
        <textarea
          name="body_html"
          className="admin-html-editor"
          defaultValue={page.body_html}
          required
        />
      </label>
      <p className="admin-muted">
        Edit the full Book Taxi or Book Tour page. Hero heading and description
        above are applied on top of this content. Product card titles are synced
        from Travels / Taxi when the page loads.
      </p>

      <button type="submit" className="admin-btn">
        Save page
      </button>
    </form>
  );
}
