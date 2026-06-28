/**
 * Normalize WordPress HTML for consistent server-rendered markup.
 */
export function normalizeSiteHtml(html: string) {
  let result = html.replace(/\sviewbox=/gi, " viewBox=");

  // Drop WordPress cruft after the footer (duplicate joinchat, photoswipe shell,
  // stray body stylesheet links). Unstyled photoswipe buttons were showing as
  // dark pill buttons at the bottom of product pages.
  const footerClose = result.lastIndexOf("</footer>");
  if (footerClose !== -1) {
    result = result.slice(0, footerClose + "</footer>".length);
  }

  // Product calendar — only Available / Unavailable in the legend
  result = result.replace(
    /<div class="enix-cal-legend-item">\s*<span class="enix-cal-legend-box booked"><\/span>\s*<span>Booked<\/span>\s*<\/div>\s*/gi,
    ""
  );

  return result;
}
