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

const LISTING_CARD_DEFAULTS = {
  taxi: {
    badge: "PRIVATE TRANSFER SERVICE",
    buttonText: "BOOK TAXI",
    productCat: "product_cat-book-taxi",
    defaultImage: "/wp-content/uploads/2026/03/taxi-cards/highway-transfer.jpg",
  },
  tour: {
    badge: "TOURS DEPARTING FROM",
    buttonText: "BOOK TOUR",
    productCat: "product_cat-book-tours",
    defaultImage: "/wp-content/uploads/2026/06/Bob-Marley-museum-2.jpg",
  },
} as const;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildListingCardHtml(options: {
  category: "taxi" | "tour";
  slug: string;
  title: string;
  wordpressId: string;
  imageUrl?: string | null;
}) {
  const defaults = LISTING_CARD_DEFAULTS[options.category];
  const imageUrl = options.imageUrl || defaults.defaultImage;
  const safeTitle = escapeHtml(options.title);

  return `<style id="loop-dynamic-236">
                                .e-loop-item-${options.wordpressId} .elementor-element.elementor-element-382cd96:not(.elementor-motion-effects-element-type-background),
                                .e-loop-item-${options.wordpressId} .elementor-element.elementor-element-382cd96>.elementor-motion-effects-container>.elementor-motion-effects-layer {
                                    background-image: url("${imageUrl}");
                                }
                            </style>
                            <div data-elementor-type="loop-item" data-elementor-id="236" class="elementor elementor-236 e-loop-item e-loop-item-${options.wordpressId} post-${options.wordpressId} product type-product status-publish has-post-thumbnail ${defaults.productCat} instock shipping-taxable purchasable product-type-rental"
                                data-elementor-post-type="elementor_library" data-custom-edit-handle="1">
                                <div class="elementor-element elementor-element-e694feb e-con-full e-flex e-con e-child" data-id="e694feb" data-element_type="container" data-e-type="container" data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                                    <div class="elementor-element elementor-element-382cd96 e-con-full e-flex e-con e-child" data-id="382cd96" data-element_type="container" data-e-type="container" data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                                    </div>
                                    <div class="elementor-element elementor-element-63a7681 elementor-widget elementor-widget-heading" data-id="63a7681" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
                                        <h4 class="elementor-heading-title elementor-size-default">${defaults.badge}</h4>
                                    </div>
                                    <div class="elementor-element elementor-element-d3e1cf4 e-con-full e-flex e-con e-child" data-id="d3e1cf4" data-element_type="container" data-e-type="container">
                                        <div class="elementor-element elementor-element-c4329ea elementor-widget elementor-widget-theme-post-title elementor-page-title elementor-widget-heading" data-id="c4329ea" data-element_type="widget" data-e-type="widget" data-widget_type="theme-post-title.default">
                                            <h1 class="elementor-heading-title elementor-size-default">${safeTitle}</h1>
                                        </div>
                                        <div class="elementor-element elementor-element-6b8822f elementor-align-center elementor-widget elementor-widget-button" data-id="6b8822f" data-element_type="widget" data-e-type="widget" data-widget_type="button.default">
                                            <a class="elementor-button elementor-button-link elementor-size-sm" href="/product/${options.slug}/">
						<span class="elementor-button-content-wrapper">
									<span class="elementor-button-text">${defaults.buttonText}</span>
					</span>
					</a>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
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
