import path from "path";
import { fileURLToPath } from "url";
import { copyLocalFile, processPage } from "./process-page.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceRoot = path.join(root, "..", "ronicascontact.com", "ronicas.com");

await processPage({
  sourceHtmlPath: path.join(sourceRoot, "contact-us", "index.html"),
  outputHtmlPath: path.join(root, "src", "content", "contact-page-body.html"),
  publicRoot: path.join(root, "public"),
  elementorCss: {
    source: path.join(sourceRoot, "wp-content", "uploads", "elementor", "css", "post-469.css"),
    dest: path.join(root, "public", "wp-content", "uploads", "elementor", "css", "post-469.css"),
  },
});

const pluginAssets = [
  [
    path.join(
      sourceRoot,
      "wp-content",
      "plugins",
      "pro-elements",
      "assets",
      "css",
      "widget-form.min.css"
    ),
    path.join(
      root,
      "public",
      "wp-content",
      "plugins",
      "pro-elements",
      "assets",
      "css",
      "widget-form.min.css"
    ),
  ],
  [
    path.join(
      sourceRoot,
      "wp-content",
      "plugins",
      "elementor",
      "assets",
      "css",
      "widget-google_maps.min.css"
    ),
    path.join(
      root,
      "public",
      "wp-content",
      "plugins",
      "elementor",
      "assets",
      "css",
      "widget-google_maps.min.css"
    ),
  ],
];

for (const [source, dest] of pluginAssets) {
  if (copyLocalFile(source, dest)) {
    console.log(`Copied ${path.basename(dest)}`);
  }
}
