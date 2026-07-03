import { NextResponse } from "next/server";
import {
  calculateBookingTotal,
  findProductByPostIdAsync,
  getProductPricingAsync,
} from "@/lib/products";
import { sendBookingRequestNotification } from "@/lib/email";
import { getSiteUrl } from "@/lib/env";
import { encodeBookingToken } from "@/lib/booking-verify";
import { saveOrder } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isBookingRangeBlocked,
  parseBlockedDates,
} from "@/lib/product-availability";
import { isValidBookingTime } from "@/lib/booking-time";
import type { BookingDetails } from "@/lib/paypal";
import type { ProductPricing } from "@/lib/products";

type BookingPayload = {
  action?: string;
  product_id?: string;
  pickup_date?: string;
  dropoff_date?: string;
  pickup_time?: string;
  dropoff_time?: string;
  guests?: string;
  departure_location?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_message?: string;
};

function wpSuccess(data: Record<string, unknown>) {
  return NextResponse.json({ success: true, data });
}

function wpError(message: string, status = 400) {
  return NextResponse.json({ success: false, data: { message } }, { status });
}

async function getBlockedDatesForProduct(slug: string) {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("products")
    .select("blocked_dates")
    .eq("slug", slug)
    .maybeSingle();

  return parseBlockedDates(data?.blocked_dates);
}

function validateTaxiTimes(
  pricing: ProductPricing,
  pickupTime: string,
  dropoffTime: string
): string | null {
  if (pricing.rentalType !== "taxi") {
    return null;
  }

  if (!isValidBookingTime(pickupTime)) {
    return "Please select a pick-up time.";
  }

  if (pricing.tripType === "round_trip" && !isValidBookingTime(dropoffTime)) {
    return "Please select a drop-off time.";
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const productId = searchParams.get("product_id");

  if (action !== "enix_get_calendar_bookings") {
    return wpError("Unsupported action.");
  }

  if (!productId) {
    return wpError("Missing product.");
  }

  const product = await findProductByPostIdAsync(productId);
  if (!product) {
    return wpSuccess({ booked_dates: [], unavailable_dates: [] });
  }

  const unavailableDates = await getBlockedDatesForProduct(product.slug);

  return wpSuccess({
    booked_dates: [],
    unavailable_dates: unavailableDates,
  });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let payload: BookingPayload;

    if (contentType.includes("application/json")) {
      payload = (await request.json()) as BookingPayload;
    } else {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries()) as BookingPayload;
    }

    const action = payload.action;
    const productId = payload.product_id?.toString();
    const pickupDate = payload.pickup_date?.toString() || "";
    const dropoffDate = payload.dropoff_date?.toString() || pickupDate;
    const pickupTime = payload.pickup_time?.toString().trim() || "";
    const dropoffTime = payload.dropoff_time?.toString().trim() || "";
    const guests = Number(payload.guests || 1);
    const departureLocation = payload.departure_location?.toString() || "";

    if (!productId) {
      return wpError("Missing product.");
    }

    const product = await findProductByPostIdAsync(productId);
    if (!product) {
      return wpError("Unknown product.");
    }

    const pricing = await getProductPricingAsync(product.slug);
    const productTitle = pricing.title;

    if (!pickupDate) {
      return wpError("Please select a pick-up date.");
    }

    if (guests < pricing.minPax) {
      return wpError(`Minimum ${pricing.minPax} passenger(s) required.`);
    }

    if (pricing.locations.length > 0 && !departureLocation) {
      return wpError("Please select a departure location.");
    }

    const blockedDates = await getBlockedDatesForProduct(product.slug);
    if (isBookingRangeBlocked(blockedDates, pickupDate, dropoffDate)) {
      return wpError(
        "One or more selected dates are unavailable. Please choose different dates."
      );
    }

    const taxiTimeError = validateTaxiTimes(pricing, pickupTime, dropoffTime);
    if (taxiTimeError) {
      return wpError(taxiTimeError);
    }

    const taxiPickupTime =
      pricing.rentalType === "taxi" ? pickupTime : undefined;
    const taxiDropoffTime =
      pricing.rentalType === "taxi" && pricing.tripType === "round_trip"
        ? dropoffTime
        : undefined;

    if (action === "enix_request_booking") {
      const customerName = payload.customer_name?.toString().trim() || "";
      const customerEmail = payload.customer_email?.toString().trim() || "";

      if (!customerName) {
        return wpError("Please enter your name.");
      }
      if (!customerEmail) {
        return wpError("Please enter your email.");
      }

      await sendBookingRequestNotification({
        productTitle,
        pickupDate,
        dropoffDate,
        pickupTime: taxiPickupTime,
        dropoffTime: taxiDropoffTime,
        guests,
        departureLocation: departureLocation || undefined,
        customerName,
        customerEmail,
        customerPhone: payload.customer_phone?.toString(),
        customerAddress: payload.customer_address?.toString(),
        customerMessage: payload.customer_message?.toString(),
      });

      await saveOrder({
        product_slug: product.slug,
        product_title: productTitle,
        order_type: "request",
        status: "request",
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: payload.customer_phone?.toString() || null,
        customer_address: payload.customer_address?.toString() || null,
        customer_message: payload.customer_message?.toString() || null,
        pickup_date: pickupDate,
        dropoff_date: dropoffDate,
        pickup_time: taxiPickupTime || null,
        dropoff_time: taxiDropoffTime || null,
        guests,
        departure_location: departureLocation || null,
        amount: calculateBookingTotal(
          pricing,
          guests,
          departureLocation || undefined,
        ),
        currency: "USD",
        paypal_order_id: null,
      });

      return wpSuccess({
        message:
          "Your booking request was sent successfully. We will contact you shortly.",
      });
    }

    if (action === "enix_booking_add_to_cart") {
      if (guests > pricing.maxSeats) {
        return wpError(
          `Online booking is available for up to ${pricing.maxSeats} passengers. Please submit a request booking for larger groups.`
        );
      }

      const amount = calculateBookingTotal(
        pricing,
        guests,
        departureLocation || undefined,
      );

      const booking: BookingDetails = {
        productSlug: product.slug,
        productTitle,
        pickupDate,
        dropoffDate,
        pickupTime: taxiPickupTime,
        dropoffTime: taxiDropoffTime,
        guests,
        departureLocation: departureLocation || undefined,
        amount,
      };

      const pendingOrderId = await saveOrder({
        product_slug: product.slug,
        product_title: productTitle,
        order_type: "pending",
        status: "pending",
        customer_name: null,
        customer_email: null,
        customer_phone: null,
        customer_address: null,
        customer_message: null,
        pickup_date: pickupDate,
        dropoff_date: dropoffDate,
        pickup_time: taxiPickupTime || null,
        dropoff_time: taxiDropoffTime || null,
        guests,
        departure_location: departureLocation || null,
        amount,
        currency: "USD",
        paypal_order_id: null,
      });

      if (pendingOrderId) {
        booking.pendingOrderId = pendingOrderId;
      }

      const token = encodeBookingToken(booking);
      const siteUrl = getSiteUrl().replace(/\/$/, "");

      return wpSuccess({
        redirect_url: `${siteUrl}/checkout?booking=${token}`,
      });
    }

    return wpError("Unsupported action.");
  } catch (error) {
    console.error("Booking API error:", error);
    return wpError(
      error instanceof Error ? error.message : "Could not process booking.",
      500,
    );
  }
}
