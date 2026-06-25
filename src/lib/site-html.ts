/**
 * Normalize WordPress HTML for consistent server-rendered markup.
 */
export function normalizeSiteHtml(html: string) {
  return html.replace(/\sviewbox=/gi, " viewBox=");
}
