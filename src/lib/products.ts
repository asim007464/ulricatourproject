import fs from "fs";
import path from "path";
import taxiManifest from "@/content/taxi-products-manifest.json";
import tourManifest from "@/content/tour-products-manifest.json";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DbProduct } from "@/lib/supabase/types";

export type ProductEntry = {
  slug: string;
  title: string;
  bodyClass: string;
};

const products: ProductEntry[] = [
  ...(taxiManifest.products as ProductEntry[]),
  ...(tourManifest.products as ProductEntry[]),
];

export type ProductPricing = {
  slug: string;
  title: string;
  basePrice: number;
  basePaxLimit: number;
  extraSurcharge: number;
  maxSeats: number;
  minPax: number;
  rentalType: string;
  locations: Array<{ name: string; base_price: number; extra_fee: number }>;
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#036;/g, "$")
    .replace(/&#038;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/&quot;/g, '"');
}

function parseFormAttributes(html: string): Omit<ProductPricing, "slug" | "title"> {
  const formMatch = html.match(/<form class="enix-bf-form"([^>]*)>/);
  if (!formMatch) {
    throw new Error("Booking form not found in product HTML");
  }

  const attrs = formMatch[1];
  const readNumber = (name: string, fallback = 0) => {
    const match = attrs.match(new RegExp(`data-${name}="([^"]+)"`));
    return match ? Number(match[1]) : fallback;
  };
  const readString = (name: string, fallback = "") => {
    const match = attrs.match(new RegExp(`data-${name}="([^"]+)"`));
    return match ? decodeHtmlEntities(match[1]) : fallback;
  };

  let locations: ProductPricing["locations"] = [];
  const locationsMatch = attrs.match(/data-locations="([^"]+)"/);
  if (locationsMatch) {
    const decoded = decodeHtmlEntities(locationsMatch[1]);
    locations = JSON.parse(decoded) as ProductPricing["locations"];
  }

  return {
    basePrice: readNumber("base-price"),
    basePaxLimit: readNumber("base-pax-limit", 4),
    extraSurcharge: readNumber("extra-surcharge"),
    maxSeats: readNumber("max-seats", 6),
    minPax: readNumber("min-pax", 1),
    rentalType: readString("rental-type"),
    locations,
  };
}

export function getPostIdFromBodyClass(bodyClass: string): string | null {
  const match = bodyClass.match(/postid-(\d+)/);
  return match ? match[1] : null;
}

export function findProductByPostId(postId: string): ProductEntry | undefined {
  return products.find(
    (product) => getPostIdFromBodyClass(product.bodyClass) === postId
  );
}

export function findProductBySlug(slug: string): ProductEntry | undefined {
  return products.find((product) => product.slug === slug);
}

export async function findProductByPostIdAsync(
  postId: string
): Promise<ProductEntry | undefined> {
  const manifestProduct = findProductByPostId(postId);
  if (manifestProduct) return manifestProduct;

  const supabase = createAdminClient();
  if (!supabase) return undefined;

  const { data } = await supabase
    .from("products")
    .select("slug, title, category, wordpress_id, active")
    .eq("wordpress_id", postId)
    .maybeSingle();

  if (!data) return undefined;

  return {
    slug: data.slug,
    title: data.title,
    bodyClass: getDefaultBodyClass(
      data.category as "taxi" | "tour",
      data.wordpress_id || postId
    ),
  };
}

export async function resolveProductForPage(slug: string) {
  const manifest = findProductBySlug(slug);
  const supabase = createAdminClient();

  if (!supabase) {
    return manifest ? { ...manifest, wordpressId: getPostIdFromBodyClass(manifest.bodyClass) } : null;
  }

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!data && !manifest) return null;
  if (data && !data.active) return null;

  const wordpressId =
    data?.wordpress_id ||
    (manifest ? getPostIdFromBodyClass(manifest.bodyClass) : null);

  return {
    slug,
    title: data?.title || manifest?.title || slug,
    bodyClass:
      manifest?.bodyClass ||
      getDefaultBodyClass(
        (data?.category as "taxi" | "tour") || "tour",
        wordpressId || generateWordpressId()
      ),
    wordpressId,
  };
}

function getDefaultBodyClass(category: "taxi" | "tour", wordpressId: string) {
  const pageId = category === "taxi" ? "1158" : "1326";
  return `wp-singular product-template-default single single-product postid-${wordpressId} wp-embed-responsive wp-theme-hello-elementor theme-hello-elementor woocommerce woocommerce-page woocommerce-no-js qodef-qi--no-touch qi-addons-for-elementor-1.10 jkit-color-scheme hello-elementor-default elementor-default elementor-template-full-width elementor-kit-102 elementor-page-${pageId}`;
}

function generateWordpressId() {
  return `9${Date.now().toString().slice(-5)}`;
}

export function dbProductToPricing(product: DbProduct): ProductPricing {
  return {
    slug: product.slug,
    title: product.title,
    basePrice: Number(product.base_price),
    basePaxLimit: product.base_pax_limit,
    extraSurcharge: Number(product.extra_surcharge),
    maxSeats: product.max_seats,
    minPax: product.min_pax,
    rentalType: product.rental_type,
    locations: product.locations || [],
  };
}

async function getProductPricingFromSupabase(
  slug: string
): Promise<ProductPricing | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  if (!data.active) return null;
  return dbProductToPricing(data as DbProduct);
}

export async function getProductPricingAsync(
  slug: string
): Promise<ProductPricing> {
  const fromDb = await getProductPricingFromSupabase(slug);
  if (fromDb) return fromDb;

  if (findProductBySlug(slug)) {
    return getProductPricing(slug);
  }

  throw new Error(`Unknown product: ${slug}`);
}

export function getProductPricing(slug: string): ProductPricing {
  const product = findProductBySlug(slug);
  if (!product) {
    throw new Error(`Unknown product: ${slug}`);
  }

  const bodyPath = path.join(
    process.cwd(),
    "src/content/products",
    `${slug}.html`
  );
  const html = fs.readFileSync(bodyPath, "utf8");
  const pricing = parseFormAttributes(html);

  return {
    slug: product.slug,
    title: decodeHtmlEntities(product.title),
    ...pricing,
  };
}

export function calculateBookingTotal(
  pricing: ProductPricing,
  guests: number,
  departureLocation?: string
): number {
  const safeGuests = Math.max(pricing.minPax, Math.min(guests, pricing.maxSeats));
  let base = pricing.basePrice;
  let extraFee = pricing.extraSurcharge;

  if (pricing.locations.length > 0) {
    const location = pricing.locations.find(
      (entry) => entry.name === departureLocation
    );
    if (!location) {
      throw new Error("Invalid departure location");
    }
    base = location.base_price;
    extraFee = location.extra_fee;
  }

  const extras = Math.max(0, safeGuests - pricing.basePaxLimit);
  return Number((base + extras * extraFee).toFixed(2));
}
