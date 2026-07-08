import { NextResponse } from "next/server";
import {
  decodeBookingToken,
  getCapturedAmount,
  verifyBooking,
} from "@/lib/booking-verify";
import {
  sendCustomerPurchaseConfirmation,
  sendPurchaseNotification,
} from "@/lib/email";
import { capturePayPalOrder } from "@/lib/paypal";
import { markOrderPaid, saveOrder } from "@/lib/orders";

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

    const capturedAmount = getCapturedAmount(capture);
    if (
      capturedAmount != null &&
      Math.abs(capturedAmount - booking.amount) > 0.01
    ) {
      console.error(
        `PayPal amount mismatch: expected ${booking.amount}, got ${capturedAmount}`
      );
      return NextResponse.json(
        { error: "Payment amount did not match the booking total." },
        { status: 400 }
      );
    }

    const payer = capture?.payer;
    const payerName = [payer?.name?.given_name, payer?.name?.surname]
      .filter(Boolean)
      .join(" ");
    const payerEmail = payer?.email_address as string | undefined;

    const orderRecord = {
      customer_name: payerName || null,
      customer_email: payerEmail || null,
      paypal_order_id: orderId,
      amount: booking.amount,
    };

    if (booking.pendingOrderId) {
      await markOrderPaid(booking.pendingOrderId, orderRecord);
    } else {
      await saveOrder({
        product_slug: booking.productSlug,
        product_title: booking.productTitle,
        order_type: "paid",
        status: "paid",
        customer_name: orderRecord.customer_name,
        customer_email: orderRecord.customer_email,
        customer_phone: null,
        customer_address: null,
        customer_message: null,
        flight_details: null,
        pickup_date: booking.pickupDate,
        dropoff_date: booking.dropoffDate,
        pickup_time: booking.pickupTime || null,
        dropoff_time: booking.dropoffTime || null,
        guests: booking.guests,
        departure_location: booking.departureLocation || null,
        amount: booking.amount,
        currency: "USD",
        paypal_order_id: orderId,
      });
    }

    try {
      await sendPurchaseNotification(
        booking,
        { name: payerName || undefined, email: payerEmail },
        orderId
      );
    } catch (emailError) {
      console.error("Admin purchase notification failed:", emailError);
    }

    if (payerEmail) {
      try {
        await sendCustomerPurchaseConfirmation(booking, {
          name: payerName || undefined,
          email: payerEmail,
        });
      } catch (emailError) {
        console.error("Customer purchase confirmation failed:", emailError);
      }
    }

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
