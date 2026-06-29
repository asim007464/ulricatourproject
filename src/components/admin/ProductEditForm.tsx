"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteProductAction, updateProductAction } from "@/app/admin/actions";
import ProductImageField from "@/components/admin/ProductImageField";
import ProductAvailabilityField from "@/components/admin/ProductAvailabilityField";
import type { DbProduct } from "@/lib/supabase/types";

type ProductEditFormProps = {
  product: DbProduct;
};

export default function ProductEditForm({ product }: ProductEditFormProps) {
  const router = useRouter();
  const statusRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!message && !error) {
      return;
    }

    statusRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });

    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMessage("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [message, error]);

  return (
    <form
      className="admin-form"
      action={(formData) => {
        startTransition(async () => {
          setMessage("");
          setError("");

          const result = await updateProductAction(formData);
          if (result?.error) {
            setError(result.error);
            return;
          }

          setMessage("Product updated successfully.");
          router.refresh();
        });
      }}
    >
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

      <ProductImageField
        slug={product.slug}
        name="image_url"
        label="Cover image (listing card)"
        helpText="Shown on the Tours / Taxi booking page cards. Upload a file or paste an image URL."
        initialUrl={product.image_url}
      />

      <ProductImageField
        slug={product.slug}
        name="detail_image_url"
        label="Detail page image"
        helpText="Shown on the product page when a customer clicks Book Now. Upload a file or paste an image URL."
        initialUrl={product.detail_image_url}
      />

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

      <ProductAvailabilityField initialDates={product.blocked_dates ?? []} />

      <label className="admin-checkbox">
        <input
          type="checkbox"
          name="active"
          defaultChecked={product.active}
        />
        Active on website
      </label>

      <div ref={statusRef} className="admin-form-status" aria-live="polite">
        {isPending ? (
          <p className="admin-status-banner admin-status-banner--loading">
            Saving changes...
          </p>
        ) : null}
        {error ? (
          <p className="admin-status-banner admin-status-banner--error">{error}</p>
        ) : null}
        {!isPending && message ? (
          <p className="admin-status-banner admin-status-banner--success">
            {message}
          </p>
        ) : null}
      </div>

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn admin-btn-blue" disabled={isPending || deleting}>
          {isPending ? "Saving..." : message ? "Updated" : "Update product"}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-black"
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
