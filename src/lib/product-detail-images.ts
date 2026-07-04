import detailImageMap from "@/data/product-detail-images.json";

const PRODUCT_DETAIL_IMAGE_MAP = detailImageMap as Record<string, string>;

/**
 * Default detail-page images from /public/detailsimgs.
 * Admin `detail_image_url` in Supabase overrides these when set.
 */
export function getDefaultDetailImageUrl(slug: string): string | null {
  return PRODUCT_DETAIL_IMAGE_MAP[slug] ?? null;
}

/** Admin URL wins; otherwise use bundled default from Supabase/public map. */
export function resolveProductDetailImageUrl(
  slug: string,
  adminUrl?: string | null
): string | null {
  const custom = adminUrl?.trim();
  if (custom && !custom.startsWith("/detailsimgs/")) {
    return custom;
  }

  return getDefaultDetailImageUrl(slug);
}

export function listDefaultDetailImageSlugs(): string[] {
  return Object.keys(PRODUCT_DETAIL_IMAGE_MAP);
}
