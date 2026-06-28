-- Separate cover image (listing cards) from detail page image (product page)

alter table public.products
  add column if not exists detail_image_url text;
