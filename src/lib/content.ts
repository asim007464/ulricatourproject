import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DbProduct, DbSitePage } from "@/lib/supabase/types";
import type { ProductPricing } from "@/lib/products";
import { buildListingCardHtml } from "@/lib/product-template";
import {
  extractProductDetailImageUrl,
  protectSiteBrandImages,
  syncProductCoverImageInHtml,
  syncProductDetailImageInHtml,
} from "@/lib/product-image";

export {
  extractProductImageUrl,
  extractProductDetailImageUrl,
  syncProductCoverImageInHtml,
  syncProductDetailImageInHtml,
  syncProductImageInHtml,
} from "@/lib/product-image";

const PAGE_DEFAULTS: Record<
  string,
  { title: string; description: string; file: string }
> = {
  "taxi-booking": {
    title: "Book Airport Transfer",
    description:
      "Private airport transfers from Sangster International Airport (MBJ). Fixed pricing, no surprises.",
    file: "transportation-page-body.html",
  },
  tours: {
    title: "Our Tours & Experiences",
    description:
      "Explore Jamaica\u2019s most beautiful destinations with our curated selection of private tours and day trips. Each experience is designed for your comfort and enjoyment.",
    file: "tours-page-body.html",
  },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readFallbackPageHtml(slug: string) {
  const defaults = PAGE_DEFAULTS[slug];
  if (!defaults) return null;

  const filePath = path.join(
    process.cwd(),
    "src/content",
    defaults.file
  );
  return fs.readFileSync(filePath, "utf8");
}

export function applySitePageOverrides(html: string, page: DbSitePage) {
  const defaults = PAGE_DEFAULTS[page.slug];
  if (!defaults) return html;

  let result = html;
  const heroTitle = page.hero_title || defaults.title;
  const heroDescription = page.hero_description || defaults.description;

  if (defaults.title) {
    result = result.split(defaults.title).join(heroTitle);
  }

  if (defaults.description) {
    result = result.split(defaults.description).join(heroDescription);
  }

  return result;
}

export function syncListingProductTitles(
  html: string,
  products: Array<Pick<DbProduct, "slug" | "title" | "wordpress_id">>
) {
  let result = html;

  for (const product of products) {
    if (!product.wordpress_id) continue;

    const pattern = new RegExp(
      `(post-${product.wordpress_id}[\\s\\S]*?<h1 class="elementor-heading-title elementor-size-default">)([^<]*)(</h1>)`,
      "i"
    );

    result = result.replace(
      pattern,
      `$1${escapeHtml(product.title)}$3`
    );
  }

  return result;
}

function getListingWordpressIds(html: string) {
  const ids = new Set<string>();
  for (const match of html.matchAll(/e-loop-item-(\d+)/g)) {
    ids.add(match[1]);
  }
  return ids;
}

function insertBeforeLoopContainerClose(html: string, snippet: string) {
  const containerOpen =
    '<div class="elementor-loop-container elementor-grid" role="list">';
  const containerIndex = html.indexOf(containerOpen);

  if (containerIndex === -1) {
    return `${html}\n${snippet}`;
  }

  let depth = 1;
  let cursor = containerIndex + containerOpen.length;

  while (cursor < html.length && depth > 0) {
    const nextOpen = html.indexOf("<div", cursor);
    const nextClose = html.indexOf("</div>", cursor);

    if (nextClose === -1) {
      break;
    }

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      cursor = nextOpen + 4;
      continue;
    }

    depth -= 1;
    if (depth === 0) {
      return `${html.slice(0, nextClose)}\n${snippet}${html.slice(nextClose)}`;
    }

    cursor = nextClose + 6;
  }

  return `${html}\n${snippet}`;
}

export function appendMissingListingProducts(
  html: string,
  products: Array<
    Pick<
      DbProduct,
      "slug" | "title" | "wordpress_id" | "image_url" | "category" | "body_html"
    >
  >
) {
  const existingIds = getListingWordpressIds(html);
  const missing = products.filter(
    (product) => product.wordpress_id && !existingIds.has(product.wordpress_id)
  );

  if (!missing.length) {
    return html;
  }

  const cards = missing
    .map((product) =>
      buildListingCardHtml({
        category: product.category as "taxi" | "tour",
        slug: product.slug,
        title: product.title,
        wordpressId: product.wordpress_id!,
        imageUrl:
          product.image_url || extractProductImageUrl(product.body_html || ""),
      })
    )
    .join("\n");

  return insertBeforeLoopContainerClose(html, cards);
}

export function syncListingProductImages(
  html: string,
  products: Array<Pick<DbProduct, "wordpress_id" | "image_url">>
) {
  let result = html;

  for (const product of products) {
    if (!product.wordpress_id || !product.image_url) continue;

    const pattern = new RegExp(
      `(\\.e-loop-item-${product.wordpress_id}[\\s\\S]*?background-image:\\s*url\\(")[^"]+("\\))`,
      "i"
    );

    result = result.replace(pattern, `$1${product.image_url}$2`);
  }

  return result;
}

export function syncFormPricingInHtml(
  html: string,
  pricing: ProductPricing,
  wordpressId?: string | null
) {
  const locationsJson = JSON.stringify(
    pricing.locations.map((entry) => ({
      name: entry.name,
      base_price: entry.base_price,
      extra_fee: entry.extra_fee,
    }))
  ).replace(/"/g, "&quot;");

  let result = html.replace(
    /<form class="enix-bf-form"([^>]*)>/,
    `<form class="enix-bf-form" data-product-id="${wordpressId || ""}" data-base-price="${pricing.basePrice}" data-base-pax-limit="${pricing.basePaxLimit}" data-extra-surcharge="${pricing.extraSurcharge}" data-max-seats="${pricing.maxSeats}" data-min-pax="${pricing.minPax}" data-rental-type="${pricing.rentalType}" data-locations="${locationsJson}">`
  );

  if (pricing.title) {
    result = result.replace(
      /<h2 class="elementor-heading-title elementor-size-default">[^<]*<\/h2>/,
      `<h2 class="elementor-heading-title elementor-size-default">${escapeHtml(pricing.title)}</h2>`
    );
  }

  return result;
}

export async function getSitePageHtml(slug: string) {
  const supabase = createAdminClient();
  const fallback = readFallbackPageHtml(slug);

  if (!supabase) {
    return fallback;
  }

  const category = slug === "taxi-booking" ? "taxi" : "tour";
  const { data: products } = await supabase
    .from("products")
    .select("slug, title, wordpress_id, image_url, category, body_html")
    .eq("category", category)
    .eq("active", true)
    .order("title");

  const { data: page } = await supabase
    .from("site_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  let html: string | null = null;

  if (!page) {
    html = fallback
      ? applySitePageOverrides(fallback, {
          id: "",
          slug,
          title: PAGE_DEFAULTS[slug]?.title || slug,
          hero_title: PAGE_DEFAULTS[slug]?.title || null,
          hero_description: PAGE_DEFAULTS[slug]?.description || null,
          body_html: fallback || "",
          created_at: "",
          updated_at: "",
        })
      : null;
  } else {
    html = applySitePageOverrides(page.body_html, page as DbSitePage);
  }

  if (!html) {
    return null;
  }

  if (products?.length) {
    html = appendMissingListingProducts(html, products as DbProduct[]);
    html = syncListingProductTitles(html, products as DbProduct[]);
    html = syncListingProductImages(html, products as DbProduct[]);
  }

  return html;
}

export async function getProductBodyHtml(
  slug: string,
  pricing: ProductPricing,
  wordpressId?: string | null
) {
  const supabase = createAdminClient();
  const fallbackPath = path.join(
    process.cwd(),
    "src/content/products",
    `${slug}.html`
  );
  const fallback = fs.existsSync(fallbackPath)
    ? fs.readFileSync(fallbackPath, "utf8")
    : null;

  if (!supabase) {
    return fallback
      ? syncFormPricingInHtml(fallback, pricing, wordpressId)
      : null;
  }

  const { data: product } = await supabase
    .from("products")
    .select("body_html, image_url, detail_image_url")
    .eq("slug", slug)
    .maybeSingle();

  const sourceHtml = product?.body_html || fallback;
  if (!sourceHtml) return null;

  let html = sourceHtml;

  if (product?.image_url) {
    html = syncProductCoverImageInHtml(html, product.image_url);
  }

  const detailImageUrl =
    product?.detail_image_url || product?.image_url || null;

  if (detailImageUrl) {
    html = syncProductDetailImageInHtml(
      html,
      detailImageUrl,
      extractProductDetailImageUrl(sourceHtml)
    );
  } else {
    html = protectSiteBrandImages(html);
  }

  return syncFormPricingInHtml(
    protectSiteBrandImages(html),
    pricing,
    wordpressId
  );
}
