import RonicasPageClient from "@/components/RonicasPageClient";
import { normalizeSiteHtml } from "@/lib/site-html";

type RonicasPageProps = {
  bodyHtml: string;
  bodyClassName: string;
  enableHeroSlideshow?: boolean;
  loadBookingScripts?: boolean;
};

export default function RonicasPage({
  bodyHtml,
  bodyClassName,
  enableHeroSlideshow = false,
  loadBookingScripts = false,
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
      />
    </>
  );
}
