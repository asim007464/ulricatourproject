import path from "path";
import { fileURLToPath } from "url";
import { copyLocalFile, processPage } from "./process-page.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceRoot = path.join(root, "..", "ronicasabout.com", "ronicas.com");

await processPage({
  sourceHtmlPath: path.join(sourceRoot, "about-us", "index.html"),
  outputHtmlPath: path.join(root, "src", "content", "about-page-body.html"),
  publicRoot: path.join(root, "public"),
  elementorCss: {
    source: path.join(sourceRoot, "wp-content", "uploads", "elementor", "css", "post-427.css"),
    dest: path.join(root, "public", "wp-content", "uploads", "elementor", "css", "post-427.css"),
  },
});

const widgetVideoSource = path.join(
  sourceRoot,
  "wp-content",
  "plugins",
  "elementor",
  "assets",
  "css",
  "widget-video.min.css"
);
const widgetVideoDest = path.join(
  root,
  "public",
  "wp-content",
  "plugins",
  "elementor",
  "assets",
  "css",
  "widget-video.min.css"
);

if (copyLocalFile(widgetVideoSource, widgetVideoDest)) {
  console.log("Copied widget-video.min.css");
}
