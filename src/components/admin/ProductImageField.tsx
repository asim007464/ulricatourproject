"use client";

import { useRef, useState } from "react";

type ProductImageFieldProps = {
  slug: string;
  name: string;
  label: string;
  helpText: string;
  initialUrl?: string | null;
};

export default function ProductImageField({
  slug,
  name,
  label,
  helpText,
  initialUrl,
}: ProductImageFieldProps) {
  const [imageUrl, setImageUrl] = useState(initialUrl || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", slug);

      const response = await fetch("/api/admin/upload-product-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Upload failed.");
      }

      setImageUrl(result.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload image."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="admin-image-field">
      <label>
        {label}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>

      <label>
        Image URL
        <input
          type="url"
          name={name}
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://..."
        />
      </label>

      {uploading ? <p className="admin-muted">Uploading image...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {imageUrl ? (
        <div className="admin-image-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={`${label} preview`} />
        </div>
      ) : (
        <p className="admin-muted">{helpText}</p>
      )}
    </div>
  );
}
