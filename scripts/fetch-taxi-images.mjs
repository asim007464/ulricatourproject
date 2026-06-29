import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "src/content/taxi-products-manifest.json"), "utf8")
);

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetch(res.headers.location).then(resolve).catch(reject);
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

const url = "https://ronicas.com/taxi-booking/";
const html = await fetch(url);
const images = [
  ...new Set(html.match(/\/wp-content\/uploads\/[^"'\\s)]+\.(?:jpg|jpeg|png|webp)/gi) ?? []),
];
console.log(`Found ${images.length} images on taxi-booking page:`);
for (const image of images) console.log(image);
