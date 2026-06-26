"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProductAction } from "@/app/admin/actions";
import ProductImageField from "@/components/admin/ProductImageField";

export default function ProductCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("new-product");

  return (
    <form
      className="admin-form"
      action={async (formData) => {
        setError("");
        const result = await createProductAction(formData);
        if (result?.error) {
          setError(result.error);
        }
      }}
    >
      {error ? <p className="admin-error">{error}</p> : null}

      <label>
        Title
        <input type="text" name="title" required />
      </label>

      <label>
        Slug (URL)
        <input
          type="text"
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="my-new-tour"
          required
        />
      </label>
      <p className="admin-muted">Product page: /product/{slug || "your-slug"}</p>

      <label>
        Category
        <select name="category" required defaultValue="taxi">
          <option value="taxi">Taxi / Transfer</option>
          <option value="tour">Tours</option>
        </select>
      </label>

      <label>
        Description
        <textarea name="description" />
      </label>

      <ProductImageField slug={slug || "new-product"} />

      <label>
        Base price (USD)
        <input type="number" name="base_price" step="0.01" min="0" defaultValue="100" required />
      </label>

      <label>
        Extra surcharge per passenger above limit
        <input
          type="number"
          name="extra_surcharge"
          step="0.01"
          min="0"
          defaultValue="30"
          required
        />
      </label>

      <label>
        Base passenger limit
        <input type="number" name="base_pax_limit" min="1" defaultValue="4" required />
      </label>

      <label>
        Minimum passengers
        <input type="number" name="min_pax" min="1" defaultValue="1" required />
      </label>

      <label>
        Maximum seats
        <input type="number" name="max_seats" min="1" defaultValue="6" required />
      </label>

      <label>
        Departure locations (JSON)
        <textarea name="locations" defaultValue="[]" />
      </label>

      <label className="admin-checkbox">
        <input type="checkbox" name="active" defaultChecked />
        Active on website
      </label>

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn">
          Create product
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
