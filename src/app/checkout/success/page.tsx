import Link from "next/link";
import "../checkout.css";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; amount?: string }>;
}) {
  const params = await searchParams;
  const title = params.title ? decodeURIComponent(params.title) : null;
  const amount = params.amount ? decodeURIComponent(params.amount) : null;

  return (
    <main className="checkout-page">
      <div className="checkout-card">
        <h1>Payment Successful</h1>
        <p className="checkout-subtitle">
          Thank you for your booking. Your payment has been received.
        </p>
        {title ? (
          <div className="checkout-summary">
            <h2>{title}</h2>
            {amount ? (
              <ul>
                <li className="checkout-total">
                  <span>Paid</span>
                  <strong>${amount} USD</strong>
                </li>
              </ul>
            ) : null}
          </div>
        ) : null}
        <p className="checkout-note">
          A confirmation email has been sent if you paid with a PayPal account
          that includes your email address.
        </p>
        <Link href="/" className="checkout-link">
          Return to homepage
        </Link>
      </div>
    </main>
  );
}
