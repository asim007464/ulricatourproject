import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvFile() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length) {
      process.env[key] = rest.join("=").trim();
    }
  }
}

loadEnvFile();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const detailImageMap = JSON.parse(
  fs.readFileSync(
    path.join(root, "src/data/product-detail-images.json"),
    "utf8"
  )
);

function extractProductDetailImageUrl(html) {
  for (const widgetId of ["920335f", "a1782f3"]) {
    const match = html.match(
      new RegExp(`data-id="${widgetId}"[\\s\\S]*?<img[^>]+src="([^"]+)"`, "i")
    );
    if (match?.[1] && !match[1].includes("RONICAS-LOGO")) {
      return match[1];
    }
  }
  return null;
}

function removeProductHeroImageElements(html) {
  return html
    .replace(/<img class="ronicas-product-hero-img"[^>]*>\s*/gi, "")
    .replace(/<img class="ronicas-product-hero-banner"[^>]*>\s*/gi, "");
}

function stripHeroBackgroundFromElementorInlineCss(html) {
  let result = html;
  for (const elementId of [
    "elementor-element-b48889c",
    "elementor-element-90dc87b",
  ]) {
    result = result.replace(
      new RegExp(`\\.${elementId}[^{]*\\{[^}]*background-image:[^}]*\\}\\s*`, "gi"),
      ""
    );
  }
  return result;
}

function getProductHeroStyleBlock() {
  const css = fs.readFileSync(
    path.join(root, "src/styles/product-hero.css"),
    "utf8"
  );
  return `<style id="ronicas-product-hero-image">\n${css}\n</style>`;
}

function buildHeroContainerInlineStyle() {
  return [
    "background-image:none",
    "background-color:transparent",
    "width:100%",
    "max-width:100%",
    "height:570px",
    "min-height:570px",
    "max-height:570px",
    "padding:0",
    "margin:0",
    "overflow:hidden",
  ].join(";");
}

function buildHeroBackgroundInlineStyle() {
  return buildHeroContainerInlineStyle();
}

function injectProductHeroBackgroundStyle(html, imageUrl) {
  const styleBlock = getProductHeroStyleBlock();

  let result = html.replace(
    /<style id="ronicas-product-hero-image">[\s\S]*?<\/style>\s*/i,
    ""
  );

  result = stripHeroBackgroundFromElementorInlineCss(result);

  const footerIdx = result.lastIndexOf("</footer>");
  if (footerIdx !== -1) {
    result =
      result.slice(0, footerIdx) + `\n${styleBlock}\n` + result.slice(footerIdx);
  } else {
    result = `${result}\n${styleBlock}`;
  }

  return result;
}

function injectProductHeroBannerImage(html, imageUrl) {
  const safeSrc = imageUrl.replace(/"/g, "&quot;");
  const imgTag = `<img class="ronicas-product-hero-banner" src="${safeSrc}" alt="" decoding="async" aria-hidden="true" />`;
  let result = html;

  for (const dataId of ["b48889c", "90dc87b"]) {
    const existingPattern = new RegExp(
      `(data-id="${dataId}"[\\s\\S]*?<div class="e-con-inner">)\\s*<img class="ronicas-product-hero-banner"[^>]*>\\s*(</div>)`,
      "i"
    );

    if (existingPattern.test(result)) {
      result = result.replace(existingPattern, `$1\n${imgTag}\n$2`);
      continue;
    }

    const emptyPattern = new RegExp(
      `(data-id="${dataId}"[\\s\\S]*?<div class="e-con-inner">)\\s*(</div>)`,
      "i"
    );
    result = result.replace(emptyPattern, `$1\n${imgTag}\n$2`);
  }

  return result;
}

function injectProductHeroInlineBackground(html, _imageUrl) {
  const bgStyle = buildHeroBackgroundInlineStyle();
  let result = html;

  for (const dataId of ["b48889c", "90dc87b"]) {
    const tagPattern = new RegExp(
      `<div\\b[^>]*\\bdata-id="${dataId}"\\b[^>]*>`,
      "i"
    );

    result = result.replace(tagPattern, (tag) => {
      const classMatch = tag.match(/\bclass="([^"]*)"/i);
      const settingsMatch = tag.match(/\bdata-settings="([^"]*)"/i);
      const classes =
        classMatch?.[1] ??
        `elementor-element elementor-element-${dataId} e-lazyloaded e-flex e-con-boxed e-con e-parent`;
      const settings =
        settingsMatch?.[1] ??
        "{&quot;background_background&quot;:&quot;classic&quot;}";

      return `<div class="${classes}" data-id="${dataId}" data-element_type="container" data-e-type="container" data-settings="${settings}" style="${bgStyle}">`;
    });
  }

  return result;
}

function syncProductHeroBackground(html, imageUrl) {
  if (!imageUrl || !html) return html;

  let result = removeProductHeroImageElements(html);
  for (const elementId of [
    "elementor-element-b48889c",
    "elementor-element-90dc87b",
  ]) {
    result = result.replace(
      new RegExp(`\\.${elementId}[^{]*\\{[^}]*background-image:[^}]*\\}\\s*`, "gi"),
      ""
    );
  }

  result = injectProductHeroBackgroundStyle(result, imageUrl);
  result = injectProductHeroInlineBackground(result, imageUrl);
  return injectProductHeroBannerImage(result, imageUrl);
}

function applyProductPageImages(html, imageUrl, previousUrl) {
  if (!imageUrl || !html) return html;

  let result = syncProductHeroBackground(html, imageUrl);
  result = syncProductDetailImageInHtml(result, imageUrl, previousUrl);
  return result;
}

function syncProductDetailImageInHtml(html, imageUrl, previousUrl) {
  if (!imageUrl || !html) return html;

  let result = html;
  for (const widgetId of ["920335f", "a1782f3"]) {
    const pattern = new RegExp(
      `(data-id="${widgetId}"[\\s\\S]*?<img[^>]+src=")([^"]+)(")`,
      "i"
    );
    result = result.replace(pattern, `$1${imageUrl}$3`);
  }

  if (previousUrl && previousUrl !== imageUrl) {
    result = result.replaceAll(previousUrl, imageUrl);
  }

  return result;
}

const { data: products, error } = await supabase
  .from("products")
  .select("slug, body_html, detail_image_url");

if (error) {
  console.error("Failed to load products:", error.message);
  process.exit(1);
}

let updated = 0;

for (const product of products || []) {
  const mappedUrl = detailImageMap[product.slug];
  if (!mappedUrl) {
    console.log(`Skip ${product.slug} — no image in /public/detailsimgs map`);
    continue;
  }

  const previousUrl =
    product.detail_image_url || extractProductDetailImageUrl(product.body_html || "");
  const bodyHtml = product.body_html
    ? applyProductPageImages(product.body_html, mappedUrl, previousUrl)
    : product.body_html;

  const { error: updateError } = await supabase
    .from("products")
    .update({
      body_html: bodyHtml,
      detail_image_url: mappedUrl,
    })
    .eq("slug", product.slug);

  if (updateError) {
    console.error(`Failed to update ${product.slug}:`, updateError.message);
    process.exit(1);
  }

  updated += 1;
  console.log(`Updated ${product.slug} → ${mappedUrl}`);
}

console.log(`Done. Updated ${updated} product(s).`);
