import fs from "fs";
import path from "path";
import RonicasPage from "@/components/RonicasPage";

const HOME_BODY_CLASS =
  "home wp-singular page-template-default page page-id-98 wp-embed-responsive wp-theme-hello-elementor theme-hello-elementor woocommerce-no-js qodef-qi--no-touch qi-addons-for-elementor-1.10 jkit-color-scheme hello-elementor-default elementor-default elementor-kit-102 elementor-page elementor-page-98";

export default function Home() {
  const bodyHtml = fs.readFileSync(
    path.join(process.cwd(), "src/content/page-body.html"),
    "utf8"
  );

  return (
    <RonicasPage
      bodyHtml={bodyHtml}
      bodyClassName={HOME_BODY_CLASS}
      enableHeroSlideshow
    />
  );
}
