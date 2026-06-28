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

function decodeHtmlEntities(value) {
  return value
    .replace(/&#036;/g, "$")
    .replace(/&#038;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/&quot;/g, '"');
}

function parseFormAttributes(html) {
  const formMatch = html.match(/<form class="enix-bf-form"([^>]*)>/);
  if (!formMatch) {
    throw new Error("Booking form not found");
  }

  const attrs = formMatch[1];
  const readNumber = (name, fallback = 0) => {
    const match = attrs.match(new RegExp(`data-${name}="([^"]+)"`));
    return match ? Number(match[1]) : fallback;
  };
  const readString = (name, fallback = "") => {
    const match = attrs.match(new RegExp(`data-${name}="([^"]+)"`));
    return match ? decodeHtmlEntities(match[1]) : fallback;
  };

  let locations = [];
  const locationsMatch = attrs.match(/data-locations="([^"]+)"/);
  if (locationsMatch) {
    locations = JSON.parse(decodeHtmlEntities(locationsMatch[1]));
  }

  return {
    wordpress_id: attrs.match(/data-product-id="([^"]+)"/)?.[1] || null,
    base_price: readNumber("base-price"),
    base_pax_limit: readNumber("base-pax-limit", 4),
    extra_surcharge: readNumber("extra-surcharge"),
    max_seats: readNumber("max-seats", 6),
    min_pax: readNumber("min-pax", 1),
    duration_days: readNumber("duration-days", 1),
    rental_type: readString("rental-type", "tour"),
    locations,
  };
}

function extractProductImageUrl(html) {
  const heroMatch = html.match(/background-image:url\("([^"]+)"\)/);
  if (heroMatch?.[1] && !heroMatch[1].includes("RONICAS-LOGO")) {
    return heroMatch[1];
  }

  const imageMatches = [...html.matchAll(/src="(\/wp-content\/uploads\/[^"]+)"/g)];
  for (const match of imageMatches) {
    const url = match[1];
    if (
      url.includes("RONICAS-LOGO") ||
      url.includes("payment-icons") ||
      url.includes("gemini-svg")
    ) {
      continue;
    }
    return url;
  }

  return null;
}

function extractDescription(html) {
  const match = html.match(
    /<div class="elementor-widget-container">\s*<p>([\s\S]*?)<\/p>\s*<h3>Tour Includes<\/h3>/i
  );
  if (!match) return null;
  return match[1].replace(/<[^>]+>/g, "").trim();
}

async function seedCategory(manifestPath, category) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  for (const product of manifest.products) {
    const htmlPath = path.join(
      root,
      "src/content/products",
      `${product.slug}.html`
    );
    const html = fs.readFileSync(htmlPath, "utf8");
    const parsed = parseFormAttributes(html);
    const description = extractDescription(html);

    const imageUrl = extractProductImageUrl(html);

    const row = {
      slug: product.slug,
      wordpress_id: parsed.wordpress_id,
      title: decodeHtmlEntities(product.title),
      category,
      base_price: parsed.base_price,
      base_pax_limit: parsed.base_pax_limit,
      extra_surcharge: parsed.extra_surcharge,
      max_seats: parsed.max_seats,
      min_pax: parsed.min_pax,
      duration_days: parsed.duration_days,
      rental_type: parsed.rental_type,
      description,
      body_html: html,
      image_url: imageUrl,
      detail_image_url: imageUrl,
      locations: parsed.locations,
      active: true,
    };

    const { error } = await supabase.from("products").upsert(row, {
      onConflict: "slug",
    });

    if (error) {
      console.error(`Failed to seed ${product.slug}:`, error.message);
      process.exit(1);
    }

    console.log(`Seeded ${product.slug}`);
  }
}

await seedCategory(
  path.join(root, "src/content/tour-products-manifest.json"),
  "tour"
);
await seedCategory(
  path.join(root, "src/content/taxi-products-manifest.json"),
  "taxi"
);

const sitePages = [
  {
    slug: "taxi-booking",
    title: "Book Taxi",
    hero_title: "Book Airport Transfer",
    hero_description:
      "Private airport transfers from Sangster International Airport (MBJ). Fixed pricing, no surprises.",
    file: "transportation-page-body.html",
  },
  {
    slug: "tours",
    title: "Book Tours",
    hero_title: "Our Tours & Experiences",
    hero_description:
      "Explore Jamaica\u2019s most beautiful destinations with our curated selection of private tours and day trips. Each experience is designed for your comfort and enjoyment.",
    file: "tours-page-body.html",
  },
];

for (const page of sitePages) {
  const bodyHtml = fs.readFileSync(
    path.join(root, "src/content", page.file),
    "utf8"
  );

  const { error } = await supabase.from("site_pages").upsert(
    {
      slug: page.slug,
      title: page.title,
      hero_title: page.hero_title,
      hero_description: page.hero_description,
      body_html: bodyHtml,
    },
    { onConflict: "slug" }
  );

  if (error) {
    console.error(`Failed to seed page ${page.slug}:`, error.message);
    process.exit(1);
  }

  console.log(`Seeded page ${page.slug}`);
}

console.log("Done. Products and pages are ready in Supabase.");
