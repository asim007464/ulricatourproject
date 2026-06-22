import { NextResponse } from "next/server";
import { capturePayPalOrder, type BookingDetails } from "@/lib/paypal";
import { sendPurchaseNotification } from "@/lib/email";
import {
  calculateBookingTotal,
  getProductPricing,
} from "@/lib/products";

function decodeBookingToken(token: string): BookingDetails {
  return JSON.parse(
    Buffer.from(token, "base64url").toString("utf8")
  ) as BookingDetails;
}

function verifyBooking(booking: BookingDetails): BookingDetails {
  const pricing = getProductPricing(booking.productSlug);
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

    const booking = verifyBooking(decodeBookingToken(bookingToken));
    const capture = await capturePayPalOrder(orderId);

    const payer = capture?.payer;
    const payerName = [payer?.name?.given_name, payer?.name?.surname]
      .filter(Boolean)
      .join(" ");
    const payerEmail = payer?.email_address as string | undefined;

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
