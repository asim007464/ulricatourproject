import fs from "fs";
import path from "path";
import RonicasPage from "@/components/RonicasPage";

const TRANSPORTATION_BODY_CLASS =
  "wp-singular page-template page-template-elementor_header_footer page page-id-624 wp-embed-responsive wp-theme-hello-elementor theme-hello-elementor woocommerce-no-js qodef-qi--no-touch qi-addons-for-elementor-1.10 jkit-color-scheme hello-elementor-default elementor-default elementor-template-full-width elementor-kit-102 elementor-page elementor-page-624";

export default function TransportationPage() {
  const bodyHtml = fs.readFileSync(
    path.join(process.cwd(), "src/content/transportation-page-body.html"),
    "utf8"
  );

  return (
    <RonicasPage
      bodyHtml={bodyHtml}
      bodyClassName={TRANSPORTATION_BODY_CLASS}
    />
  );
}
