import Link from "next/link";
import "../checkout.css";

export default function CheckoutSuccessPage() {
  return (
    <main className="checkout-page">
      <div className="checkout-card">
        <h1>Payment Successful</h1>
        <p className="checkout-subtitle">
          Thank you for your booking. We have received your payment and sent a
          confirmation alert to our team.
        </p>
        <Link href="/" className="checkout-link">
          Return to homepage
        </Link>
      </div>
    </main>
  );
}
