import { NextResponse } from "next/server";
import { capturePayPalOrder, type BookingDetails } from "@/lib/paypal";
import { sendPurchaseNotification } from "@/lib/email";
import {
  calculateBookingTotal,
  getProductPricingAsync,
} from "@/lib/products";
import { saveOrder } from "@/lib/orders";

function decodeBookingToken(token: string): BookingDetails {
  return JSON.parse(
    Buffer.from(token, "base64url").toString("utf8")
  ) as BookingDetails;
}

async function verifyBooking(booking: BookingDetails): Promise<BookingDetails> {
  const pricing = await getProductPricingAsync(booking.productSlug);
  const amount = calculateBookingTotal(
    pricing,
    booking.guests,
    booking.departureLocation
  );

  return {
    ...booking,
    productTitle: pricing.title,
    amount,
  };
}

export async function POST(request: Request) {
  try {
    const { orderId, bookingToken } = (await request.json()) as {
      orderId?: string;
      bookingToken?: string;
    };

    if (!orderId || !bookingToken) {
      return NextResponse.json(
        { error: "Missing order details." },
        { status: 400 }
      );
    }

    const booking = await verifyBooking(decodeBookingToken(bookingToken));
    const capture = await capturePayPalOrder(orderId);

    const payer = capture?.payer;
    const payerName = [payer?.name?.given_name, payer?.name?.surname]
      .filter(Boolean)
      .join(" ");
    const payerEmail = payer?.email_address as string | undefined;

    await saveOrder({
      product_slug: booking.productSlug,
      product_title: booking.productTitle,
      order_type: "paid",
      status: "paid",
      customer_name: payerName || null,
      customer_email: payerEmail || null,
      customer_phone: null,
      customer_address: null,
      customer_message: null,
      pickup_date: booking.pickupDate,
      dropoff_date: booking.dropoffDate,
      guests: booking.guests,
      departure_location: booking.departureLocation || null,
      amount: booking.amount,
      currency: "USD",
      paypal_order_id: orderId,
    });

    await sendPurchaseNotification(
      booking,
      { name: payerName || undefined, email: payerEmail },
      orderId
    );

    return NextResponse.json({ success: true, capture });
  } catch (error) {
    console.error("PayPal capture-order error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not capture payment.",
      },
      { status: 500 }
    );
  }
}
