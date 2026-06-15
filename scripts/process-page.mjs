import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

const ARROW_ICON_SVG =
  '<svg class="icon-colored" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 17 17 7M17 7H9M17 7v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const FOOTER_ICON_SVG =
  '<svg class="footer-list-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M8.25 10h4.25M11.75 7.75 14 10l-2.25 2.25" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function extractElementorInlineCss(html) {
  const match = html.match(
    /<style id="elementor-frontend-inline-css">([\s\S]*?)<\/style>/i
  );
  if (!match) return "";

  return match[1]
    .replace(/https:\/\/ronicas\.com\/wp-content/g, "/wp-content")
    .replace(/https:\/\/ronicas\.com\//g, "/");
}

function markElementorParentsLazyLoaded(html) {
  return html.replace(/class="([^"]*)"/g, (match, classes) => {
    if (!/\be-con\b/.test(classes) || !/\be-parent\b/.test(classes)) {
      return match;
    }
    if (classes.includes("e-lazyloaded")) {
      return match;
    }
    return `class="e-lazyloaded ${classes}"`;
  });
}

export function processProductBodyHtml(html) {
  const inlineCss = extractElementorInlineCss(html);
  let body = markElementorParentsLazyLoaded(processBodyHtml(html));

  if (inlineCss.trim()) {
    body = `<style id="elementor-frontend-inline-css">${inlineCss}</style>\n${body}`;
  }

  return body;
}

export function processBodyHtml(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) {
    throw new Error("Could not extract body from HTML");
  }

  return bodyMatch[1]
    .replace(/https:\/\/ronicas\.com\/wp-content/g, "/wp-content")
    .replace(/https:\/\/ronicas\.com\//g, "/")
    .replace(/https:\/\/ronicas\.com"/g, '/"')
    .replace(/href="\/wp-admin[^"]*"/g, 'href="#"')
    .replace(/href="\/xmlrpc[^"]*"/g, 'href="#"')
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(
      /<i class="icon-colored jki jki-arrow-up-right-line" aria-hidden="true"><\/i>/g,
      ARROW_ICON_SVG
    )
    .replace(
      /<i aria-hidden="true" class="jki jki-right-arrow-9"><\/i>/g,
      FOOTER_ICON_SVG
    )
    .trim();
}

export function collectImageUrls(html) {
  const mediaRegex =
    /https:\/\/ronicas\.com\/wp-content\/uploads\/[^"'\s)]+\.(?:jpg|jpeg|png|gif|svg|webp|mp4)/gi;
  return [...new Set(html.match(mediaRegex) || [])];
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      resolve("exists");
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
        file.on("finish", () => file.close(() => resolve("ok")));
      })
      .on("error", reject);
  });
}

export async function downloadImages(imageUrls, publicRoot) {
  for (const url of imageUrls) {
    const relative = url.replace("https://ronicas.com", "");
    const dest = path.join(publicRoot, relative);
    try {
      const result = await download(url, dest);
      console.log(result === "exists" ? "SKIP (exists):" : "OK:", relative);
    } catch (err) {
      console.warn("FAIL:", relative, err.message);
    }
  }
}

export async function ensureRemoteFile(url, dest) {
  try {
    const result = await download(url, dest);
    console.log(result === "exists" ? "SKIP (exists):" : "OK:", path.relative(process.cwd(), dest));
    return true;
  } catch (err) {
    console.warn("FAIL:", dest, err.message);
    return false;
  }
}

export function extractBodyClass(html) {
  const match = html.match(/<body[^>]*class="([^"]*)"/i);
  return match ? match[1] : "";
}

export function extractPageTitle(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  if (!match) return "";
  return match[1]
    .replace(/\s*&#8211;\s*Ronica.*$/i, "")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .trim();
}

export async function fetchRemoteHtml(url, retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await new Promise((resolve, reject) => {
        const client = url.startsWith("https") ? https : http;
        client
          .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
              fetchRemoteHtml(res.headers.location, retries)
                .then(resolve)
                .catch(reject);
              return;
            }
            if (res.statusCode !== 200) {
              reject(new Error(`Failed ${url}: ${res.statusCode}`));
              return;
            }
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => resolve(data));
          })
          .on("error", reject);
      });
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      }
    }
  }

  throw lastError;
}

export async function ensureIconFont(publicRoot) {
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
}

export function copyElementorCss(sourceCssPath, destCssPath) {
  if (!fs.existsSync(sourceCssPath)) {
    return null;
  }

  const originalCss = fs.readFileSync(sourceCssPath, "utf8");
  const css = originalCss.replace(
    /url\("https:\/\/ronicas\.com\/wp-content\/uploads\//g,
    'url("/wp-content/uploads/'
  );
  fs.mkdirSync(path.dirname(destCssPath), { recursive: true });
  fs.writeFileSync(destCssPath, css, "utf8");
  return originalCss;
}

export function collectCssImageUrls(css) {
  const cssImageRegex =
    /https:\/\/ronicas\.com\/wp-content\/uploads\/[^"')]+\.(?:jpg|jpeg|png|gif|svg|webp|mp4)/gi;
  return [...new Set(css.match(cssImageRegex) || [])];
}

export function copyLocalFile(sourcePath, destPath) {
  if (!fs.existsSync(sourcePath)) {
    return false;
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(sourcePath, destPath);
  return true;
}

export async function processPage({
  sourceHtmlPath,
  outputHtmlPath,
  publicRoot,
  elementorCss,
}) {
  const html = fs.readFileSync(sourceHtmlPath, "utf8");
  const body = processBodyHtml(html);
  fs.mkdirSync(path.dirname(outputHtmlPath), { recursive: true });
  fs.writeFileSync(outputHtmlPath, body, "utf8");

  const images = collectImageUrls(html);
  if (elementorCss?.source && elementorCss?.dest) {
    const css = copyElementorCss(elementorCss.source, elementorCss.dest);
    if (css) {
      images.push(...collectCssImageUrls(css));
      console.log(`Copied ${path.basename(elementorCss.dest)}`);
    }
  }

  const uniqueImages = [...new Set(images)];
  console.log(`Downloading ${uniqueImages.length} images...`);
  await downloadImages(uniqueImages, publicRoot);
  await ensureIconFont(publicRoot);

  console.log("Wrote", outputHtmlPath);
}
