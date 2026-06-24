"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteProductAction, updateProductAction } from "@/app/admin/actions";
import ProductImageField from "@/components/admin/ProductImageField";
import type { DbProduct } from "@/lib/supabase/types";

type ProductEditFormProps = {
  product: DbProduct;
};

export default function ProductEditForm({ product }: ProductEditFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  return (
    <form
      className="admin-form"
      action={async (formData) => {
        setMessage("");
        setError("");
        const result = await updateProductAction(formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        setMessage("Product updated successfully.");
      }}
    >
      {error ? <p className="admin-error">{error}</p> : null}
      {message ? <p className="admin-success">{message}</p> : null}

      <input type="hidden" name="slug" value={product.slug} />
      <input type="hidden" name="rental_type" value={product.rental_type} />

      <label>
        Title
        <input type="text" name="title" defaultValue={product.title} required />
      </label>

      <label>
        Description
        <textarea name="description" defaultValue={product.description || ""} />
      </label>

      <ProductImageField slug={product.slug} initialUrl={product.image_url} />

      <label>
        Base price (USD)
        <input
          type="number"
          name="base_price"
          step="0.01"
          min="0"
          defaultValue={product.base_price}
          required
        />
      </label>

      <label>
        Extra surcharge per passenger above limit
        <input
          type="number"
          name="extra_surcharge"
          step="0.01"
          min="0"
          defaultValue={product.extra_surcharge}
          required
        />
      </label>

      <label>
        Base passenger limit
        <input
          type="number"
          name="base_pax_limit"
          min="1"
          defaultValue={product.base_pax_limit}
          required
        />
      </label>

      <label>
        Minimum passengers
        <input
          type="number"
          name="min_pax"
          min="1"
          defaultValue={product.min_pax}
          required
        />
      </label>

      <label>
        Maximum seats
        <input
          type="number"
          name="max_seats"
          min="1"
          defaultValue={product.max_seats}
          required
        />
      </label>

      <label>
        Page content (HTML)
        <textarea
          name="body_html"
          className="admin-html-editor"
          defaultValue={product.body_html || ""}
        />
      </label>
      <p className="admin-muted">
        Full tour/transfer page HTML. Pricing fields above are synced into the
        booking form automatically when you save.
      </p>

      <label>
        Departure locations (JSON)
        <textarea
          name="locations"
          defaultValue={JSON.stringify(product.locations || [], null, 2)}
        />
      </label>

      <label className="admin-checkbox">
        <input
          type="checkbox"
          name="active"
          defaultChecked={product.active}
        />
        Active on website
      </label>

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn">
          Update product
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => router.push("/admin/products")}
        >
          Back
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-danger"
          disabled={deleting}
          onClick={async () => {
            const confirmed = window.confirm(
              `Delete "${product.title}"? This cannot be undone.`
            );
            if (!confirmed) return;

            setDeleting(true);
            setError("");
            const formData = new FormData();
            formData.append("slug", product.slug);
            const result = await deleteProductAction(formData);
            if (result?.error) {
              setError(result.error);
              setDeleting(false);
            }
          }}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </form>
  );
}
