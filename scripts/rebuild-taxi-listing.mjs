import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { downloadTaxiCardImages } from "./download-taxi-card-images.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const transportationPath = path.join(
  root,
  "src",
  "content",
  "transportation-page-body.html"
);
const toursPath = path.join(root, "src", "content", "tours-page-body.html");
const manifestPath = path.join(root, "src", "content", "taxi-products-manifest.json");
const cardImagesPath = path.join(root, "src", "content", "taxi-card-images.json");

const DEFAULT_IMAGE =
  "/wp-content/uploads/2026/03/Gemini_Generated_Image_x073vbx073vbx073-e1773295454769.png";
const BANNER_TEXT = "PRIVATE TRANSFER SERVICE";
const BUTTON_TEXT = "BOOK TAXI";

function loadCardImages() {
  if (!fs.existsSync(cardImagesPath)) return {};
  return JSON.parse(fs.readFileSync(cardImagesPath, "utf8"));
}

function getProductImage(slug, cardImages) {
  const mapped = cardImages[slug];
  if (!mapped) {
    return DEFAULT_IMAGE;
  }

  const localPath = path.join(root, "public", mapped.replace(/^\//, "").replace(/\//g, path.sep));
  if (fs.existsSync(localPath) && fs.statSync(localPath).size > 1000) {
    return mapped;
  }

  return DEFAULT_IMAGE;
}

function loadProducts() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const cardImages = loadCardImages();

  return manifest.products.map((product) => {
    const postIdMatch = product.bodyClass.match(/postid-(\d+)/);
    const postId = postIdMatch?.[1];

    if (!postId) {
      throw new Error(`Missing post id for ${product.slug}`);
    }

    return {
      postId,
      slug: product.slug,
      title: product.title,
      href: `/product/${product.slug}/`,
      image: getProductImage(product.slug, cardImages),
    };
  });
}

function positionClass(index, total) {
  const parts = [];
  if (index === 0) parts.push("first");
  if (index === total - 1) parts.push("last");
  return parts.join(" ");
}

function buildDynamicStyle(postId, image) {
  return `<style id="loop-dynamic-236">
                                .e-loop-item-${postId} .elementor-element.elementor-element-382cd96:not(.elementor-motion-effects-element-type-background),
                                .e-loop-item-${postId} .elementor-element.elementor-element-382cd96>.elementor-motion-effects-container>.elementor-motion-effects-layer {
                                    background-image: url("${image}");
                                }
                            </style>`;
}

function buildCard(product, index, total) {
  const extraClass = positionClass(index, total);

  return `${buildDynamicStyle(product.postId, product.image)}
                            <div data-elementor-type="loop-item" data-elementor-id="236" class="elementor elementor-236 e-loop-item e-loop-item-${product.postId} post-${product.postId} product type-product status-publish has-post-thumbnail product_cat-book-taxi ${extraClass} instock shipping-taxable purchasable product-type-rental"
                                data-elementor-post-type="elementor_library" data-custom-edit-handle="1">
                                <div class="elementor-element elementor-element-e694feb e-con-full e-flex e-con e-child" data-id="e694feb" data-element_type="container" data-e-type="container" data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                                    <div class="elementor-element elementor-element-382cd96 e-con-full e-flex e-con e-child" data-id="382cd96" data-element_type="container" data-e-type="container" data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                                    </div>
                                    <div class="elementor-element elementor-element-63a7681 elementor-widget elementor-widget-heading" data-id="63a7681" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
                                        <h4 class="elementor-heading-title elementor-size-default">${BANNER_TEXT}</h4>
                                    </div>
                                    <div class="elementor-element elementor-element-d3e1cf4 e-con-full e-flex e-con e-child" data-id="d3e1cf4" data-element_type="container" data-e-type="container">
                                        <div class="elementor-element elementor-element-c4329ea elementor-widget elementor-widget-theme-post-title elementor-page-title elementor-widget-heading" data-id="c4329ea" data-element_type="widget" data-e-type="widget" data-widget_type="theme-post-title.default">
                                            <h1 class="elementor-heading-title elementor-size-default">${product.title}</h1>
                                        </div>
                                        <div class="elementor-element elementor-element-6b8822f elementor-align-center elementor-widget elementor-widget-button" data-id="6b8822f" data-element_type="widget" data-e-type="widget" data-widget_type="button.default">
                                            <a class="elementor-button elementor-button-link elementor-size-sm" href="${product.href}">
						<span class="elementor-button-content-wrapper">
									<span class="elementor-button-text">${BUTTON_TEXT}</span>
					</span>
					</a>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
}

function extractLoop236Styles(toursHtml) {
  const match = toursHtml.match(/<style id="loop-236">([\s\S]*?)<\/style>/);
  if (!match) {
    throw new Error("Could not find loop-236 styles in tours-page-body.html");
  }
  return `<style id="loop-236">${match[1]}</style>`;
}

function buildLoopSection(products, loop236Styles) {
  const cards = products
    .map((product, index) => buildCard(product, index, products.length))
    .join("\n");

  return `${loop236Styles}
                            ${cards}`;
}

export async function rebuildTaxiListing() {
  await downloadTaxiCardImages();

  const html = fs.readFileSync(transportationPath, "utf8");
  const toursHtml = fs.readFileSync(toursPath, "utf8");
  const loop236Styles = extractLoop236Styles(toursHtml);
  const products = loadProducts();

  if (products.length === 0) {
    throw new Error("No taxi products found in transportation-page-body.html");
  }

  const loopSection = buildLoopSection(products, loop236Styles);

  const gridWidgetRegex =
    /(<div class="woocommerce elementor-element elementor-element-5ec6c8e )[\s\S]*?(<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<footer)/;

  const updated = html.replace(
    gridWidgetRegex,
    `$1elementor-grid-3 elementor-grid-tablet-2 elementor-grid-mobile-1 elementor-widget elementor-widget-loop-grid" data-id="5ec6c8e" data-element_type="widget" data-e-type="widget" data-settings="{&quot;template_id&quot;:236,&quot;_skin&quot;:&quot;product&quot;,&quot;row_gap&quot;:{&quot;unit&quot;:&quot;px&quot;,&quot;size&quot;:25,&quot;sizes&quot;:[]},&quot;columns&quot;:&quot;3&quot;,&quot;columns_tablet&quot;:&quot;2&quot;,&quot;columns_mobile&quot;:&quot;1&quot;,&quot;edit_handle_selector&quot;:&quot;[data-elementor-type=\\&quot;loop-item\\&quot;]&quot;,&quot;row_gap_tablet&quot;:{&quot;unit&quot;:&quot;px&quot;,&quot;size&quot;:&quot;&quot;,&quot;sizes&quot;:[]},&quot;row_gap_mobile&quot;:{&quot;unit&quot;:&quot;px&quot;,&quot;size&quot;:&quot;&quot;,&quot;sizes&quot;:[]}}"
                    data-widget_type="loop-grid.product">
                    <div class="elementor-widget-container">
                        <div class="elementor-loop-container elementor-grid" role="list">
                            ${loopSection}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
    <footer`
  );

  if (updated === html) {
    throw new Error("Failed to update transportation-page-body.html");
  }

  fs.writeFileSync(transportationPath, updated, "utf8");
  console.log(`Rebuilt taxi listing with ${products.length} tour-style cards.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await rebuildTaxiListing();
}
