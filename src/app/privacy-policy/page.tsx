import RonicasPage from "@/components/RonicasPage";
import { getSitePageHtml } from "@/lib/content";

export const dynamic = "force-dynamic";

const PAGE_BODY_CLASS =
  "wp-singular page-template page-template-elementor_header_footer page woocommerce-no-js qodef-qi--no-touch qi-addons-for-elementor-1.10 jkit-color-scheme hello-elementor-default elementor-default elementor-template-full-width elementor-kit-102";

export default async function PrivacyPolicyPage() {
  const bodyHtml = await getSitePageHtml("privacy-policy");

  if (!bodyHtml) {
    return (
      <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 16px" }}>
        <h1>Privacy Policy</h1>
        <h2>Ronica's Splendid Tours</h2>
        <p>
          Operated by Ronicastours.com Limited
          <br />
          Last Updated: June 2026
        </p>

        <p>
          Ronica's Splendid Tours, operated by Ronicastours.com Limited, respects your privacy and is
          committed to protecting your personal information. This Privacy Policy explains how we
          collect, use, store, and protect information when you visit our website, contact us, or
          book our services.
        </p>

        <h3>Information We Collect</h3>
        <p>
          When you make a booking, request information, or communicate with us, we may collect your
          name, email address, telephone number, WhatsApp number, pickup and drop-off locations,
          flight information, and any additional details you choose to provide.
        </p>
        <p>
          We may also collect technical information such as your browser type, device information,
          IP address, and website usage data to help us improve our services and website performance.
        </p>

        <h3>How We Use Your Information</h3>
        <p>
          We use your information to provide transportation and tour services, manage reservations,
          communicate with you regarding your booking, monitor flight arrivals and delays, process
          payments, respond to inquiries, and improve our services.
        </p>

        <h3>Sharing Your Information</h3>
        <p>We do not sell, rent, or trade your personal information.</p>
        <p>
          Your information may be shared with our drivers, team members, payment processors, website
          service providers, or government authorities when required by law and only to the extent
          necessary to provide our services or comply with legal obligations.
        </p>

        <h3>Data Retention</h3>
        <p>
          We retain personal information only for as long as necessary to provide our services,
          maintain business records, comply with legal requirements, and resolve any disputes that may
          arise. When information is no longer required, it will be securely deleted or anonymized where
          appropriate.
        </p>

        <h3>Cookies</h3>
        <p>
          Our website may use cookies and similar technologies to improve your browsing experience, analyze
          website traffic, and enhance website functionality. You may choose to disable cookies through your
          browser settings, although some website features may not function correctly as a result.
        </p>

        <h3>Data Security</h3>
        <p>
          We take reasonable steps to protect your personal information from unauthorized access, loss,
          misuse, or disclosure. While no method of transmission over the internet can be guaranteed to be
          completely secure, we are committed to maintaining appropriate safeguards to protect your information.
        </p>

        <h3>Your Rights</h3>
        <p>
          You may request access to the personal information we hold about you, ask us to correct inaccurate
          information, request deletion of your information where legally permitted, or withdraw consent where
          applicable. Requests may be submitted using the contact information below.
        </p>

        <h3>Children's Privacy</h3>
        <p>
          Our services are intended for adults making travel and transportation arrangements. We do not knowingly
          collect personal information from children.
        </p>

        <h3>Third-Party Websites</h3>
        <p>
          Our website may contain links to external websites. We are not responsible for the privacy practices or
          content of third-party websites.
        </p>

        <h3>Changes to This Privacy Policy</h3>
        <p>
          We may update this Privacy Policy from time to time. Any changes will be posted on this page together
          with an updated revision date.
        </p>

        <h3>Contact Us</h3>
        <p>
          Ronica's Splendid Tours
          <br />
          Operated by Ronicastours.com Limited
          <br />
          Email: info@ronicas.com
          <br />
          Website: www.ronicas.com
        </p>
      </main>
    );
  }

  return <RonicasPage bodyHtml={bodyHtml} bodyClassName={PAGE_BODY_CLASS} />;
}

