import fs from "fs";
import path from "path";
import type { ProductPricing } from "@/lib/products";

const TEMPLATE_SLUGS = {
  taxi: "one-way-transfer-mbj-airport-to-montego-bay-hotels",
  tour: "ys-falls-adventure",
} as const;

export function slugifyTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateWordpressId() {
  return `9${Date.now().toString().slice(-5)}`;
}

export function getDefaultBodyClass(category: "taxi" | "tour", wordpressId: string) {
  const pageId = category === "taxi" ? "1158" : "1326";
  return `wp-singular product-template-default single single-product postid-${wordpressId} wp-embed-responsive wp-theme-hello-elementor theme-hello-elementor woocommerce woocommerce-page woocommerce-no-js qodef-qi--no-touch qi-addons-for-elementor-1.10 jkit-color-scheme hello-elementor-default elementor-default elementor-template-full-width elementor-kit-102 elementor-page-${pageId}`;
}

export function buildProductHtml(options: {
  category: "taxi" | "tour";
  slug: string;
  title: string;
  wordpressId: string;
  pricing: ProductPricing;
  description?: string;
  imageUrl?: string;
}) {
  const templateSlug = TEMPLATE_SLUGS[options.category];
  const templatePath = path.join(
    process.cwd(),
    "src/content/products",
    `${templateSlug}.html`
  );
  const templateHtml = fs.readFileSync(templatePath, "utf8");
  const templateProductId =
    templateHtml.match(/data-product-id="(\d+)"/)?.[1] || "914";

  const locationsJson = JSON.stringify(
    options.pricing.locations.map((entry) => ({
      name: entry.name,
      base_price: entry.base_price,
      extra_fee: entry.extra_fee,
    }))
  ).replace(/"/g, "&quot;");

  let html = templateHtml
    .replaceAll(templateSlug, options.slug)
    .replaceAll(`post-${templateProductId}`, `post-${options.wordpressId}`)
    .replaceAll(`e-loop-item-${templateProductId}`, `e-loop-item-${options.wordpressId}`)
    .replaceAll(`data-product-id="${templateProductId}"`, `data-product-id="${options.wordpressId}"`)
    .replace(
      /<h2 class="elementor-heading-title elementor-size-default">[^<]*<\/h2>/,
      `<h2 class="elementor-heading-title elementor-size-default">${options.title}</h2>`
    )
    .replace(
      /<h1 class="elementor-heading-title elementor-size-default">[^<]*<\/h1>/,
      `<h1 class="elementor-heading-title elementor-size-default">${options.title}</h1>`
    )
    .replace(
      /<form class="enix-bf-form"([^>]*)>/,
      `<form class="enix-bf-form" data-product-id="${options.wordpressId}" data-btn-booking="BOOK NOW" data-btn-request="REQUEST BOOKING" data-base-price="${options.pricing.basePrice}" data-base-pax-limit="${options.pricing.basePaxLimit}" data-extra-surcharge="${options.pricing.extraSurcharge}" data-max-seats="${options.pricing.maxSeats}" data-min-pax="${options.pricing.minPax}" data-duration-days="1" data-rental-type="${options.pricing.rentalType}" data-currency="&#036;" data-locations="${locationsJson}">`
    );

  if (options.description) {
    html = html.replace(
      /<p>Experience one of Jamaica[\s\S]*?<\/p>/,
      `<p>${options.description}</p>`
    );
  }

  if (options.imageUrl) {
    html = html.replace(
      /background-image:url\("([^"]+)"\)/,
      `background-image:url("${options.imageUrl}")`
    );
    html = html.replace(
      /(<img[^>]+src=")(\/wp-content\/uploads\/[^"]+|https?:\/\/[^"]+)("[^>]*class="[^"]*attachment-full)/,
      `$1${options.imageUrl}$3`
    );
  }

  return html;
}
