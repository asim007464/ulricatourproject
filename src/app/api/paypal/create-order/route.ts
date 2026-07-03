import { NextResponse } from "next/server";
import { decodeBookingToken, verifyBooking } from "@/lib/booking-verify";
import { createPayPalOrder } from "@/lib/paypal";

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

    const booking = await verifyBooking(decodeBookingToken(bookingToken));
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
