import { NextResponse } from "next/server";
import { createPayPalOrder, type BookingDetails } from "@/lib/paypal";
import {
  calculateBookingTotal,
  getProductPricing,
} from "@/lib/products";

function decodeBookingToken(token: string): BookingDetails {
  const booking = JSON.parse(
    Buffer.from(token, "base64url").toString("utf8")
  ) as BookingDetails;
  return booking;
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
    const { bookingToken } = (await request.json()) as {
      bookingToken?: string;
    };

    if (!bookingToken) {
      return NextResponse.json(
        { error: "Missing booking details." },
        { status: 400 }
      );
    }

    const booking = verifyBooking(decodeBookingToken(bookingToken));
    const order = await createPayPalOrder(booking);

    return NextResponse.json({ id: order.id });
  } catch (error) {
    console.error("PayPal create-order error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create PayPal order.",
      },
      { status: 500 }
    );
  }
}
