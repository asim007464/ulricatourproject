import RonicasPage from "@/components/RonicasPage";
import { getSitePageHtml } from "@/lib/content";

export const dynamic = "force-dynamic";

const PAGE_BODY_CLASS =
  "wp-singular page-template page-template-elementor_header_footer page woocommerce-no-js qodef-qi--no-touch qi-addons-for-elementor-1.10 jkit-color-scheme hello-elementor-default elementor-default elementor-template-full-width elementor-kit-102";

export default async function RefundReturnPolicyPage() {
  const bodyHtml = await getSitePageHtml("refund-return-policy");

  if (!bodyHtml) {
    return (
      <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 16px" }}>
        <h1>Cancellation &amp; Refund Policy</h1>
        <h2>Ronica's Splendid Tours</h2>
        <p>Operated by Ronicastours.com Limited</p>

        <p>
          This Cancellation and Refund Policy applies to all airport transfers, private transportation services,
          tours, and excursions booked through Ronica's Splendid Tours (Ronicastours.com Limited).
        </p>

        <h3>1. Cancellation Windows &amp; Fees</h3>
        <ul>
          <li>
            <strong>48 Hours or More Notice:</strong> Refund: 100% Full Refund (subject to applicable non-refundable payment processing fees).
          </li>
          <li>
            <strong>Between 24 &amp; 48 Hours Notice:</strong> Refund: 50% Refund.
          </li>
          <li>
            <strong>Less Than 24 Hours Notice:</strong> Refund: Non-Refundable.
          </li>
          <li>
            <strong>No-Shows:</strong> Non-Refundable.
          </li>
        </ul>

        <h3>2. Special Travel Circumstances</h3>
        <p>
          For airport transfers, flight delays or airline changes will not result in cancellation charges when customers provide flight details during booking.
        </p>

        <h3>3. Modifications &amp; Processing</h3>
        <p>
          Approved refunds are processed back to the original payment method. Refund processing times may vary depending on the customer’s bank or payment processor.
        </p>

        <h3>4. Contact Us</h3>
        <p>
          Email: info@ronicas.com
          <br />
          Website: www.ronicas.com
        </p>
      </main>
    );
  }

  return (
    <RonicasPage bodyHtml={bodyHtml} bodyClassName={PAGE_BODY_CLASS} />
  );
}

