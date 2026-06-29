import path from "path";
import { fileURLToPath } from "url";
import { processPage } from "./process-page.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceRoot = path.join(root, "..", "ronicasbooktour.com", "ronicas.com");

await processPage({
  sourceHtmlPath: path.join(sourceRoot, "tours", "index.html"),
  outputHtmlPath: path.join(root, "src", "content", "tours-page-body.html"),
  publicRoot: path.join(root, "public"),
  elementorCss: {
    source: path.join(sourceRoot, "wp-content", "uploads", "elementor", "css", "post-391.css"),
    dest: path.join(root, "public", "wp-content", "uploads", "elementor", "css", "post-391.css"),
  },
});
