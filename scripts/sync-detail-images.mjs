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
    ? syncProductDetailImageInHtml(
        product.body_html,
        mappedUrl,
        previousUrl
      )
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
