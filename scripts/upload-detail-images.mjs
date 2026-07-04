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

const detailsDir = path.join(root, "public/detailsimgs");
const mapPath = path.join(root, "src/data/product-detail-images.json");
const slugMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));

const filenameToSlug = new Map(
  Object.entries(slugMap).map(([slug, imagePath]) => [
    path.basename(String(imagePath)),
    slug,
  ])
);

const files = fs
  .readdirSync(detailsDir)
  .filter((name) => /\.(jpe?g|png|webp|gif)$/i.test(name));

const uploadedUrls = {};

for (const filename of files) {
  const filePath = path.join(detailsDir, filename);
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filename).slice(1).toLowerCase();
  const contentType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "gif"
          ? "image/gif"
          : "image/jpeg";
  const storagePath = `details/${filename}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`Failed to upload ${filename}:`, error.message);
    process.exit(1);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(storagePath);

  uploadedUrls[filename] = publicUrl;
  console.log(`Uploaded ${filename}`);
}

const nextMap = { ...slugMap };

for (const [slug, imagePath] of Object.entries(slugMap)) {
  const filename = path.basename(String(imagePath));
  const publicUrl = uploadedUrls[filename];
  if (publicUrl) {
    nextMap[slug] = publicUrl;
  }
}

fs.writeFileSync(mapPath, `${JSON.stringify(nextMap, null, 2)}\n`);

console.log(`Updated ${mapPath}`);
console.log("Run npm run sync:detail-images to update Supabase products.");
