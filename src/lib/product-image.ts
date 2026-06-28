const SITE_LOGO_URL =
  "/wp-content/uploads/2026/02/RONICAS-LOGO-BLACK-AND-GOLD.gif";

const PRODUCT_HERO_ELEMENTS = [
  "elementor-element-b48889c",
  "elementor-element-90dc87b",
] as const;

/** Left column image on product booking pages (taxi + tour templates). */
const PRODUCT_DETAIL_IMAGE_WIDGETS = ["920335f", "a1782f3"] as const;

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
  return extractProductCoverImageUrl(html) || extractProductDetailImageUrl(html);
}

export function extractProductCoverImageUrl(html: string): string | null {
  for (const elementId of PRODUCT_HERO_ELEMENTS) {
    const match = html.match(
      new RegExp(
        `\\.${elementId}[\\s\\S]*?background-image:\\s*url\\("([^"]+)"\\)`,
        "i"
      )
    );
    if (match?.[1] && !isProtectedImageUrl(match[1])) {
      return match[1];
    }
  }

  return null;
}

export function extractProductDetailImageUrl(html: string): string | null {
  for (const widgetId of PRODUCT_DETAIL_IMAGE_WIDGETS) {
    const match = html.match(
      new RegExp(`data-id="${widgetId}"[\\s\\S]*?<img[^>]+src="([^"]+)"`, "i")
    );
    if (match?.[1] && !isProtectedImageUrl(match[1])) {
      return match[1];
    }
  }

  return null;
}

function syncProductHeroBackground(html: string, imageUrl: string) {
  let result = html;

  for (const elementId of PRODUCT_HERO_ELEMENTS) {
    const heroCssPattern = new RegExp(
      `(\\.${elementId}[\\s\\S]*?background-image:\\s*url\\(")[^"]+("\\))`,
      "i"
    );

    if (heroCssPattern.test(result)) {
      result = result.replace(heroCssPattern, `$1${imageUrl}$2`);
    }
  }

  return result;
}

function syncWidgetImageByDataId(
  html: string,
  dataId: string,
  imageUrl: string
) {
  const widgetPattern = new RegExp(
    `(data-id="${dataId}"[\\s\\S]*?<img\\b)([\\s\\S]*?)(\\/?>)`,
    "i"
  );

  if (!widgetPattern.test(html)) {
    return html;
  }

  return html.replace(widgetPattern, (_match, prefix: string, attrs: string, suffix: string) => {
    let nextAttrs = attrs
      .replace(/\ssrc="[^"]*"/i, ` src="${imageUrl}"`)
      .replace(/\ssrcset="[^"]*"/i, "")
      .replace(/\ssizes="[^"]*"/i, "");

    if (!/\ssrc="/i.test(nextAttrs)) {
      nextAttrs = ` src="${imageUrl}"${nextAttrs}`;
    }

    return `${prefix}${nextAttrs}${suffix}`;
  });
}

/** Updates the hero banner on taxi/tour product pages (cover image). */
export function syncProductCoverImageInHtml(html: string, imageUrl: string) {
  if (!imageUrl) {
    return protectSiteBrandImages(html);
  }

  let result = protectSiteBrandImages(html);
  result = syncProductHeroBackground(result, imageUrl);
  return protectSiteBrandImages(result);
}

/** Updates the left-column detail image above the calendar on product pages. */
export function syncProductDetailImageInHtml(
  html: string,
  imageUrl: string,
  previousUrl?: string | null
) {
  if (!imageUrl) {
    return protectSiteBrandImages(html);
  }

  let result = protectSiteBrandImages(html);

  for (const widgetId of PRODUCT_DETAIL_IMAGE_WIDGETS) {
    result = syncWidgetImageByDataId(result, widgetId, imageUrl);
  }

  if (previousUrl && previousUrl !== imageUrl && !isProtectedImageUrl(previousUrl)) {
    const safePrevious = escapeRegExp(previousUrl);
    for (const widgetId of PRODUCT_DETAIL_IMAGE_WIDGETS) {
      const previousPattern = new RegExp(
        `(data-id="${widgetId}"[\\s\\S]*?<img[^>]+src=")${safePrevious}(")`,
        "gi"
      );
      result = result.replace(previousPattern, `$1${imageUrl}$2`);
    }
  }

  return protectSiteBrandImages(result);
}

/** @deprecated Use syncProductDetailImageInHtml */
export const syncProductImageInHtml = syncProductDetailImageInHtml;
