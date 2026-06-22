import Link from "next/link";
import type { BookingDetails } from "@/lib/paypal";
import PayPalCheckout from "@/components/PayPalCheckout";
import "./checkout.css";

function decodeBookingToken(token: string): BookingDetails | null {
  try {
    return JSON.parse(
      Buffer.from(token, "base64url").toString("utf8")
    ) as BookingDetails;
  } catch {
    return null;
  }
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const params = await searchParams;
  const bookingToken = params.booking || "";
  const booking = bookingToken ? decodeBookingToken(bookingToken) : null;

  if (!booking || !bookingToken) {
    return (
      <main className="checkout-page">
        <div className="checkout-card">
          <h1>Checkout</h1>
          <p>No booking details were found. Please start from a tour or transfer page.</p>
          <Link href="/tours/" className="checkout-link">
            Browse tours
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-card">
        <h1>Secure Checkout</h1>
        <p className="checkout-subtitle">Complete your booking with PayPal</p>

        <div className="checkout-summary">
          <h2>{booking.productTitle}</h2>
          <ul>
            <li>
              <span>Pick-up</span>
              <strong>{booking.pickupDate}</strong>
            </li>
            <li>
              <span>Drop-off</span>
              <strong>{booking.dropoffDate}</strong>
            </li>
            <li>
              <span>Passengers</span>
              <strong>{booking.guests}</strong>
            </li>
            {booking.departureLocation ? (
              <li>
                <span>Departure</span>
                <strong>{booking.departureLocation}</strong>
              </li>
            ) : null}
            <li className="checkout-total">
              <span>Total</span>
              <strong>${booking.amount.toFixed(2)} USD</strong>
            </li>
          </ul>
        </div>

        <PayPalCheckout booking={booking} bookingToken={bookingToken} />

        <Link href={`/product/${booking.productSlug}`} className="checkout-back">
          Back to booking
        </Link>
      </div>
    </main>
  );
}
