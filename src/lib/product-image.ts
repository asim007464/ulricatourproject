const SITE_LOGO_URL =
  "/wp-content/uploads/2026/02/RONICAS-LOGO-BLACK-AND-GOLD.gif";

const PRODUCT_HERO_ELEMENTS = [
  "elementor-element-90dc87b",
  "elementor-element-b48889c",
] as const;

function isProtectedImageUrl(url: string) {
  return (
    url.includes("RONICAS-LOGO") ||
    url.includes("payment-icons") ||
    url.includes("gemini-svg") ||
    url.includes("wp-image-1194") ||
    url.includes("wp-image-1195")
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function protectSiteBrandImages(html: string) {
  let result = html;

  result = result.replace(
    /(<img\b[^>]*\bwp-image-1194\b[^>]*\bsrc=")[^"]+(")/gi,
    `$1${SITE_LOGO_URL}$2`
  );
  result = result.replace(
    /(<img\b[^>]*\bsrc=")[^"]+("[^>]*\bwp-image-1194\b)/gi,
    `$1${SITE_LOGO_URL}$2`
  );

  return result;
}

export function extractProductImageUrl(html: string): string | null {
  for (const elementId of PRODUCT_HERO_ELEMENTS) {
    const match = html.match(
      new RegExp(
        `\\.elementor-element\\.${elementId}[\\s\\S]*?background-image:\\s*url\\("([^"]+)"\\)`,
        "i"
      )
    );
    if (match?.[1] && !isProtectedImageUrl(match[1])) {
      return match[1];
    }
  }

  const contentImagePattern =
    /<img[^>]+src="([^"]+)"[^>]*class="[^"]*attachment-full[^"]*wp-image-(?!1194|1195)\d+/gi;

  for (const match of html.matchAll(contentImagePattern)) {
    if (!isProtectedImageUrl(match[1])) {
      return match[1];
    }
  }

  return null;
}

function syncProductHeroBackground(html: string, imageUrl: string) {
  let result = html;

  for (const elementId of PRODUCT_HERO_ELEMENTS) {
    const heroCssPattern = new RegExp(
      `(\\.elementor-element\\.${elementId}[\\s\\S]*?background-image:\\s*url\\(")[^"]+("\\))`,
      "i"
    );

    if (heroCssPattern.test(result)) {
      result = result.replace(heroCssPattern, `$1${imageUrl}$2`);
    }
  }

  return result;
}

function syncProductContentImages(
  html: string,
  imageUrl: string,
  previousUrl?: string | null
) {
  return html.replace(
    /(<img[^>]+src=")([^"]+)("[^>]*class="[^"]*attachment-full[^"]*wp-image-(?!1194|1195)\d+[^"]*")/gi,
    (match, prefix: string, src: string, suffix: string) => {
      if (isProtectedImageUrl(src)) {
        return match;
      }

      if (previousUrl && src !== previousUrl) {
        return match;
      }

      return `${prefix}${imageUrl}${suffix}`;
    }
  );
}

export function syncProductImageInHtml(
  html: string,
  imageUrl: string,
  previousUrl?: string | null
) {
  if (!imageUrl) {
    return protectSiteBrandImages(html);
  }

  let result = protectSiteBrandImages(html);
  result = syncProductHeroBackground(result, imageUrl);
  result = syncProductContentImages(result, imageUrl, previousUrl);

  if (previousUrl && previousUrl !== imageUrl && !isProtectedImageUrl(previousUrl)) {
    const safePrevious = escapeRegExp(previousUrl);
    const heroScopedPattern = new RegExp(
      `(\\.elementor-element\\.(?:${PRODUCT_HERO_ELEMENTS.join("|")})[\\s\\S]*?background-image:\\s*url\\(")${safePrevious}("\\))`,
      "gi"
    );
    result = result.replace(heroScopedPattern, `$1${imageUrl}$2`);
  }

  return protectSiteBrandImages(result);
}
