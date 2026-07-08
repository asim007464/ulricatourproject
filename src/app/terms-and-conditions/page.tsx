import RonicasPage from "@/components/RonicasPage";
import { getSitePageHtml } from "@/lib/content";

export const dynamic = "force-dynamic";

const PAGE_BODY_CLASS =
  "wp-singular page-template page-template-elementor_header_footer page woocommerce-no-js qodef-qi--no-touch qi-addons-for-elementor-1.10 jkit-color-scheme hello-elementor-default elementor-default elementor-template-full-width elementor-kit-102";

export default async function TermsAndConditionsPage() {
  const bodyHtml = await getSitePageHtml("terms-and-conditions");

  if (!bodyHtml) {
    return (
      <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 16px" }}>
        <h1>Terms &amp; Conditions</h1>
        <h2>Ronica's Splendid Tours</h2>
        <p>Operated by Ronicastours.com Limited</p>

        <ol>
          <li>
            <strong>Booking Confirmation</strong>
            <p>
              All bookings are confirmed once agreed via WhatsApp, email, or website.
            </p>
          </li>
          <li>
            <strong>Payments</strong>
            <p>Payment must be made as agreed prior to or at the time of service.</p>
          </li>
          <li>
            <strong>Cancellations</strong>
            <p>All cancellations are subject to our Cancellation Policy.</p>
          </li>
          <li>
            <strong>Delays</strong>
            <p>
              We are not responsible for delays caused by traffic, weather, road conditions,
              airport or airline issues.
            </p>
          </li>
          <li>
            <strong>Customer Responsibility</strong>
            <p>
              Customers must provide accurate pickup location, contact details, and flight information.
              Failure to do so may result in missed service.
            </p>
          </li>
          <li>
            <strong>Luggage</strong>
            <p>Customers are responsible for informing us of excess luggage.</p>
          </li>
          <li>
            <strong>Liability</strong>
            <p>
              Ronica's Splendid Tours is not liable for missed flights, lost items, or indirect damages.
            </p>
          </li>
          <li>
            <strong>Right to Refuse Service</strong>
            <p>
              We reserve the right to refuse service in unsafe conditions or inappropriate behavior.
            </p>
          </li>
        </ol>

        <h3>Important Notice</h3>
        <p>
          Ronica's Splendid Tours is operated exclusively through the official websites www.ronicas.com and
          www.ronicastours.com. We do not accept bookings or payments through any other website.
          If you are unsure about a booking, please contact us directly via WhatsApp or email before making any payment.
        </p>
      </main>
    );
  }

  return <RonicasPage bodyHtml={bodyHtml} bodyClassName={PAGE_BODY_CLASS} />;
}

