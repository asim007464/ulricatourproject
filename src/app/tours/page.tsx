import RonicasPage from "@/components/RonicasPage";
import { getSitePageHtml } from "@/lib/content";

export const dynamic = "force-dynamic";

const TOURS_BODY_CLASS =
  "wp-singular page-template page-template-elementor_header_footer page page-id-391 wp-embed-responsive wp-theme-hello-elementor theme-hello-elementor woocommerce-no-js qodef-qi--no-touch qi-addons-for-elementor-1.10 jkit-color-scheme hello-elementor-default elementor-default elementor-template-full-width elementor-kit-102 elementor-page elementor-page-391";

export default async function ToursPage() {
  const bodyHtml = await getSitePageHtml("tours");

  if (!bodyHtml) {
    return <p>Page content not found.</p>;
  }

  return <RonicasPage bodyHtml={bodyHtml} bodyClassName={TOURS_BODY_CLASS} />;
}
