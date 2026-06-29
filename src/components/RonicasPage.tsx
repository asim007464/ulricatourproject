import RonicasPageClient from "@/components/RonicasPageClient";
import { normalizeSiteHtml } from "@/lib/site-html";

type RonicasPageProps = {
  bodyHtml: string;
  bodyClassName: string;
  enableHeroSlideshow?: boolean;
  loadBookingScripts?: boolean;
  loadContactScripts?: boolean;
};

export default function RonicasPage({
  bodyHtml,
  bodyClassName,
  enableHeroSlideshow = false,
  loadBookingScripts = false,
  loadContactScripts = false,
}: RonicasPageProps) {
  const html = normalizeSiteHtml(bodyHtml);

  return (
    <>
      <div
        id="ronicas-site"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <RonicasPageClient
        bodyClassName={bodyClassName}
        enableHeroSlideshow={enableHeroSlideshow}
        loadBookingScripts={loadBookingScripts}
        loadContactScripts={loadContactScripts}
      />
    </>
  );
}
