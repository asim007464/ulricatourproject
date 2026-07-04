import fs from "fs";
import path from "path";

export const PRODUCT_HERO_STYLE_ID = "ronicas-product-hero-image";

let cachedHeroCss: string | null = null;

export function getProductHeroCss(): string {
  if (cachedHeroCss) return cachedHeroCss;

  cachedHeroCss = fs.readFileSync(
    path.join(process.cwd(), "src/styles/product-hero.css"),
    "utf8"
  );

  return cachedHeroCss;
}

export function buildProductHeroStyleBlock(): string {
  return `<style id="${PRODUCT_HERO_STYLE_ID}">\n${getProductHeroCss()}\n</style>`;
}

/** Inline layout on hero container — wins over Elementor CSS variables on Vercel. */
export function buildHeroContainerInlineStyle(): string {
  return [
    "background-image:none",
    "background-color:transparent",
    "width:100%",
    "max-width:100%",
    "height:200px",
    "min-height:200px",
    "max-height:200px",
    "padding:0",
    "margin:0",
    "overflow:hidden",
  ].join(";");
}
