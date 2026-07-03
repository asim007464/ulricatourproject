import type { BookingDetails } from "@/lib/paypal";
import { isValidBookingTime } from "@/lib/booking-time";
import {
  calculateBookingTotal,
  getProductPricingAsync,
} from "@/lib/products";

export function decodeBookingToken(token: string): BookingDetails {
  return JSON.parse(
    Buffer.from(token, "base64url").toString("utf8")
  ) as BookingDetails;
}

export function encodeBookingToken(booking: BookingDetails): string {
  return Buffer.from(JSON.stringify(booking)).toString("base64url");
}

export async function verifyBooking(
  booking: BookingDetails
): Promise<BookingDetails> {
  const pricing = await getProductPricingAsync(booking.productSlug);
  const amount = calculateBookingTotal(
    pricing,
    booking.guests,
    booking.departureLocation
  );

  if (pricing.rentalType === "taxi") {
    if (!booking.pickupTime || !isValidBookingTime(booking.pickupTime)) {
      throw new Error("Pick-up time is required for taxi bookings.");
    }

    if (
      pricing.tripType === "round_trip" &&
      (!booking.dropoffTime || !isValidBookingTime(booking.dropoffTime))
    ) {
      throw new Error("Drop-off time is required for round-trip taxi bookings.");
    }
  }

  return {
    ...booking,
    productTitle: pricing.title,
    amount,
  };
}

export function getCapturedAmount(capture: unknown): number | null {
  const data = capture as {
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{ amount?: { value?: string } }>;
      };
    }>;
  };

  const value =
    data.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
  if (!value) return null;
  return Number(value);
}
