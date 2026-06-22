import { NextResponse } from "next/server";
import {
  calculateBookingTotal,
  findProductByPostId,
  getProductPricing,
} from "@/lib/products";
import { sendBookingRequestNotification } from "@/lib/email";
import { getSiteUrl } from "@/lib/env";
import type { BookingDetails } from "@/lib/paypal";

type BookingPayload = {
  action?: string;
  product_id?: string;
  pickup_date?: string;
  dropoff_date?: string;
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
  return NextResponse.json(
    { success: false, data: { message } },
    { status }
  );
}

function encodeBookingToken(booking: BookingDetails) {
  return Buffer.from(JSON.stringify(booking)).toString("base64url");
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
    const guests = Number(payload.guests || 1);
    const departureLocation = payload.departure_location?.toString() || "";

    if (!productId) {
      return wpError("Missing product.");
    }

    const product = findProductByPostId(productId);
    if (!product) {
      return wpError("Unknown product.");
    }

    const pricing = getProductPricing(product.slug);
    const productTitle = pricing.title;

    if (!pickupDate) {
      return wpError("Please select a pick-up date.");
    }

    if (guests > pricing.maxSeats) {
      return wpError(`Maximum ${pricing.maxSeats} passengers allowed.`);
    }

    if (pricing.locations.length > 0 && !departureLocation) {
      return wpError("Please select a departure location.");
    }

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
        guests,
        departureLocation: departureLocation || undefined,
        customerName,
        customerEmail,
        customerPhone: payload.customer_phone?.toString(),
        customerAddress: payload.customer_address?.toString(),
        customerMessage: payload.customer_message?.toString(),
      });

      return wpSuccess({
        message:
          "Your booking request was sent successfully. We will contact you shortly.",
      });
    }

    if (action === "enix_booking_add_to_cart") {
      const amount = calculateBookingTotal(
        pricing,
        guests,
        departureLocation || undefined
      );

      const booking: BookingDetails = {
        productSlug: product.slug,
        productTitle,
        pickupDate,
        dropoffDate,
        guests,
        departureLocation: departureLocation || undefined,
        amount,
      };

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
      500
    );
  }
}
