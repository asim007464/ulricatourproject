import path from "path";
import { fileURLToPath } from "url";
import { processPage } from "./process-page.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceRoot = path.join(root, "..", "ronicasbook.com", "ronicas.com");

await processPage({
  sourceHtmlPath: path.join(sourceRoot, "taxi-booking", "index.html"),
  outputHtmlPath: path.join(root, "src", "content", "transportation-page-body.html"),
  publicRoot: path.join(root, "public"),
  elementorCss: {
    source: path.join(sourceRoot, "wp-content", "uploads", "elementor", "css", "post-624.css"),
    dest: path.join(root, "public", "wp-content", "uploads", "elementor", "css", "post-624.css"),
  },
});
