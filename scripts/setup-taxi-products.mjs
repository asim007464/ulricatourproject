import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  collectCssImageUrls,
  collectImageUrls,
  copyElementorCss,
  copyLocalFile,
  downloadImages,
  ensureIconFont,
  extractBodyClass,
  extractPageTitle,
  fetchRemoteHtml,
  processProductBodyHtml,
} from "./process-page.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicRoot = path.join(root, "public");
const sourceRoot = path.join(root, "..", "ronicastaxidetail.com", "ronicas.com");
const productsDir = path.join(root, "src", "content", "products");

const TAXI_PRODUCT_SLUGS = [
  "one-way-transfer-mbj-airport-to-montego-bay-hotels",
  "one-way-private-transfer-mbj-airport-to-negril",
  "one-way-private-transfer-mbj-airport-to-falmouth-trelawny",
  "round-trip-private-transfer-mbj-airport-to-negril",
  "round-trip-private-transfer-mbj-airport-to-falmouth-trelawny",
  "one-way-private-transfer-mbj-airport-to-ocho-rios",
  "round-trip-private-transfer-mbj-airport-to-ocho-rios",
  "one-way-private-transfer-mbj-airport-to-grand-palladium-resort-lucea",
  "round-trip-private-transfer-mbj-airport-to-grand-palladium-resort-lucea",
  "one-way-private-transfer-mbj-airport-to-princess-hotel-lucea",
  "round-trip-private-transfer-mbj-airport-to-princess-hotel-lucea",
];

fs.mkdirSync(productsDir, { recursive: true });

const allImages = [];

copyElementorCss(
  path.join(sourceRoot, "wp-content", "uploads", "elementor", "css", "post-1158.css"),
  path.join(publicRoot, "wp-content", "uploads", "elementor", "css", "post-1158.css")
);

const pluginAssets = [
  [
    path.join(sourceRoot, "wp-includes", "css", "dist", "block-library", "style.min.css"),
    path.join(publicRoot, "wp-includes", "css", "dist", "block-library", "style.min.css"),
  ],
  [
    path.join(sourceRoot, "wp-includes", "js", "jquery", "jquery.min.js"),
    path.join(publicRoot, "wp-includes", "js", "jquery", "jquery.min.js"),
  ],
  [
    path.join(sourceRoot, "wp-includes", "js", "jquery", "jquery-migrate.min.js"),
    path.join(publicRoot, "wp-includes", "js", "jquery", "jquery-migrate.min.js"),
  ],
];

for (const [source, dest] of pluginAssets) {
  if (copyLocalFile(source, dest)) {
    console.log(`Copied ${path.basename(dest)}`);
  }
}

const post1158Css = fs.readFileSync(
  path.join(publicRoot, "wp-content", "uploads", "elementor", "css", "post-1158.css"),
  "utf8"
);
allImages.push(...collectCssImageUrls(post1158Css));

const manifestPath = path.join(root, "src", "content", "taxi-products-manifest.json");
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : { products: [] };

function extractProductMetaFromBody(body, slug) {
  const titleMatch = body.match(
    /elementor-element-887ff3a[\s\S]*?<h2 class="elementor-heading-title[^"]*">([^<]+)</
  );
  const postIdMatch = body.match(/post-(\d+) product/);
  const postId = postIdMatch?.[1] ?? "914";
  const title = titleMatch
    ? titleMatch[1]
        .replace(/&#8211;/g, "–")
        .replace(/&amp;/g, "&")
        .replace(/&#039;/g, "'")
        .trim()
    : slug;

  const bodyClass = `wp-singular product-template-default single single-product postid-${postId} wp-embed-responsive wp-theme-hello-elementor theme-hello-elementor woocommerce woocommerce-page woocommerce-no-js qodef-qi--no-touch qi-addons-for-elementor-1.10 jkit-color-scheme hello-elementor-default elementor-default elementor-template-full-width elementor-kit-102 elementor-page-1158`;

  return { slug, title, bodyClass };
}

for (const slug of TAXI_PRODUCT_SLUGS) {
  const localPath = path.join(sourceRoot, "product", slug, "index.html");
  const outputPath = path.join(productsDir, `${slug}.html`);

  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 5000) {
    const body = fs.readFileSync(outputPath, "utf8");
    if (body.includes('id="elementor-frontend-inline-css"')) {
      const entry = extractProductMetaFromBody(body, slug);
      const index = manifest.products.findIndex((item) => item.slug === slug);
      if (index >= 0) {
        manifest.products[index] = entry;
      } else {
        manifest.products.push(entry);
      }
      allImages.push(...collectImageUrls(body));
      console.log(`SKIP (exists): ${slug}`);
      continue;
    }
    console.log(`Refreshing hero banner: ${slug}`);
  }

  let html;

  if (fs.existsSync(localPath)) {
    html = fs.readFileSync(localPath, "utf8");
    console.log(`Using local: ${slug}`);
  } else {
    const url = `https://ronicas.com/product/${slug}/`;
    console.log(`Downloading: ${url}`);
    html = await fetchRemoteHtml(url);
  }

  const body = processProductBodyHtml(html);
  fs.writeFileSync(outputPath, body, "utf8");

  const entry = {
    slug,
    title: extractPageTitle(html),
    bodyClass: extractBodyClass(html),
  };

  const index = manifest.products.findIndex((item) => item.slug === slug);
  if (index >= 0) {
    manifest.products[index] = entry;
  } else {
    manifest.products.push(entry);
  }

  allImages.push(...collectImageUrls(html));
  console.log(`Wrote products/${slug}.html`);
}

manifest.products = TAXI_PRODUCT_SLUGS.map((slug) =>
  manifest.products.find((entry) => entry.slug === slug)
).filter(Boolean);

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

const uniqueImages = [...new Set(allImages)];
console.log(`Downloading ${uniqueImages.length} images...`);
await downloadImages(uniqueImages, publicRoot);
await ensureIconFont(publicRoot);

console.log(`Done. ${manifest.products.length} taxi product pages.`);
