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

      <p className="admin-muted">
        Hero heading and description are shown at the top of the page. Product
        cards are synced automatically from Travels / Taxi when the page loads.
      </p>

      <button type="submit" className="admin-btn admin-btn-success">
        Save page
      </button>
    </form>
  );
}
