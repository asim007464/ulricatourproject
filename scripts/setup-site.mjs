import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceHtml = path.join(
  root,
  "..",
  "ronicas.com",
  "ronicas.com",
  "index.html"
);
const outputHtml = path.join(root, "src", "content", "page-body.html");
const publicRoot = path.join(root, "public");

const html = fs.readFileSync(sourceHtml, "utf8");
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
if (!bodyMatch) {
  throw new Error("Could not extract body from index.html");
}

let body = bodyMatch[1];

// Replace remote asset URLs with local public paths
body = body
  .replace(/https:\/\/ronicas\.com\/wp-content/g, "/wp-content")
  .replace(/https:\/\/ronicas\.com\//g, "/")
  .replace(/href="\/wp-admin[^"]*"/g, 'href="#"')
  .replace(/href="\/xmlrpc[^"]*"/g, 'href="#"')
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(
    /<i class="icon-colored jki jki-arrow-up-right-line" aria-hidden="true"><\/i>/g,
    '<svg class="icon-colored" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 17 17 7M17 7H9M17 7v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  )
  .replace(
    /<i aria-hidden="true" class="jki jki-right-arrow-9"><\/i>/g,
    '<svg class="footer-list-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M8.25 10h4.25M11.75 7.75 14 10l-2.25 2.25" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  );

// Extract inline styles from head for custom CSS block
const customStyleMatch = html.match(
  /<style>\s*(\/\* Even product[\s\S]*?)<\/style>/
);
const customCss = customStyleMatch ? customStyleMatch[1] : "";

fs.mkdirSync(path.dirname(outputHtml), { recursive: true });
fs.writeFileSync(outputHtml, body.trim(), "utf8");

const customCssPath = path.join(root, "src", "content", "custom.css");
fs.writeFileSync(customCssPath, customCss, "utf8");

// Collect unique image URLs from original HTML
const imageRegex =
  /https:\/\/ronicas\.com\/wp-content\/uploads\/[^"'\s)]+\.(?:jpg|jpeg|png|gif|svg|webp)/gi;
const images = [...new Set(html.match(imageRegex) || [])];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest)) {
      resolve();
      return;
    }

    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          download(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed ${url}: ${res.statusCode}`));
          return;
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", reject);
  });
}

console.log(`Downloading ${images.length} images...`);
for (const url of images) {
  const relative = url.replace("https://ronicas.com", "");
  const dest = path.join(publicRoot, relative);
  try {
    await download(url, dest);
    console.log("OK:", relative);
  } catch (err) {
    console.warn("SKIP:", relative, err.message);
  }
}

const iconFontUrl =
  "https://ronicas.com/wp-content/plugins/jeg-elementor-kit/assets/fonts/jkiticon/jkiticon.woff2";
const iconFontDest = path.join(
  publicRoot,
  "wp-content/plugins/jeg-elementor-kit/assets/fonts/jkiticon/jkiticon.woff2"
);
const existingFont = fs.existsSync(iconFontDest)
  ? fs.statSync(iconFontDest).size
  : 0;
if (existingFont < 1000) {
  try {
    await download(iconFontUrl, iconFontDest);
    console.log("OK: jkiticon.woff2");
  } catch (err) {
    console.warn("SKIP: jkiticon.woff2", err.message);
  }
}

console.log("Done. Body HTML written to", outputHtml);
