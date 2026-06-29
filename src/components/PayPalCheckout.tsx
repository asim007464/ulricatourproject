"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import type { BookingDetails } from "@/lib/paypal";

type PayPalCheckoutProps = {
  booking: BookingDetails;
  bookingToken: string;
};

export default function PayPalCheckout({
  booking,
  bookingToken,
}: PayPalCheckoutProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  if (!clientId) {
    return (
      <p className="checkout-error">
        PayPal is not configured. Add NEXT_PUBLIC_PAYPAL_CLIENT_ID to your
        environment.
      </p>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: "USD",
        intent: "capture",
      }}
    >
      <PayPalButtons
        style={{ layout: "vertical", shape: "rect", label: "paypal" }}
        createOrder={async () => {
          const response = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingToken }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Could not start PayPal checkout.");
          }

          return data.id;
        }}
        onApprove={async (data) => {
          const response = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.orderID,
              bookingToken,
            }),
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || "Payment could not be completed.");
          }

          window.location.href = "/checkout/success";
        }}
        onError={() => {
          alert("PayPal encountered an error. Please try again.");
        }}
      />
      <p className="checkout-note">
        You are paying <strong>${booking.amount.toFixed(2)} USD</strong> for{" "}
        <strong>{booking.productTitle}</strong>.
      </p>
    </PayPalScriptProvider>
  );
}
