import nodemailer from "nodemailer";
import { getSmtpConfig } from "@/lib/env";
import type { BookingDetails } from "@/lib/paypal";

function createTransport() {
  const { user, password } = getSmtpConfig();
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass: password,
    },
  });
}

function bookingSummaryLines(booking: BookingDetails) {
  return [
    `Product: ${booking.productTitle}`,
    `Pick-up: ${booking.pickupDate}`,
    `Drop-off: ${booking.dropoffDate}`,
    `Passengers: ${booking.guests}`,
    booking.departureLocation
      ? `Departure: ${booking.departureLocation}`
      : null,
    `Total: $${booking.amount.toFixed(2)} USD`,
  ].filter(Boolean);
}

export async function sendPurchaseNotification(
  booking: BookingDetails,
  payer?: { name?: string; email?: string },
  orderId?: string
) {
  const { user, notificationEmail } = getSmtpConfig();
  const transport = createTransport();

  const lines = [
    "New paid booking received.",
    "",
    ...bookingSummaryLines(booking),
    "",
    payer?.name ? `Customer: ${payer.name}` : null,
    payer?.email ? `Email: ${payer.email}` : null,
    orderId ? `PayPal order: ${orderId}` : null,
  ].filter(Boolean);

  await transport.sendMail({
    from: `"Ronica's Splendid Tours" <${user}>`,
    to: notificationEmail,
    subject: `New booking: ${booking.productTitle}`,
    text: lines.join("\n"),
  });
}

export async function sendBookingRequestNotification(details: {
  productTitle: string;
  pickupDate: string;
  dropoffDate: string;
  guests: number;
  departureLocation?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  customerMessage?: string;
}) {
  const { user, notificationEmail } = getSmtpConfig();
  const transport = createTransport();

  const lines = [
    "New booking request submitted.",
    "",
    `Product: ${details.productTitle}`,
    `Pick-up: ${details.pickupDate}`,
    `Drop-off: ${details.dropoffDate}`,
    `Passengers: ${details.guests}`,
    details.departureLocation
      ? `Departure: ${details.departureLocation}`
      : null,
    "",
    `Name: ${details.customerName}`,
    `Email: ${details.customerEmail}`,
    details.customerPhone ? `Phone: ${details.customerPhone}` : null,
    details.customerAddress ? `Address: ${details.customerAddress}` : null,
    details.customerMessage ? `Message: ${details.customerMessage}` : null,
  ].filter(Boolean);

  await transport.sendMail({
    from: `"Ronica's Splendid Tours" <${user}>`,
    to: notificationEmail,
    subject: `Booking request: ${details.productTitle}`,
    text: lines.join("\n"),
  });

  await transport.sendMail({
    from: `"Ronica's Splendid Tours" <${user}>`,
    to: details.customerEmail,
    subject: "We received your booking request",
    text: [
      `Hi ${details.customerName},`,
      "",
      "Thank you for your booking request. Our team will contact you shortly to confirm availability.",
      "",
      `Tour: ${details.productTitle}`,
      `Pick-up: ${details.pickupDate}`,
      `Drop-off: ${details.dropoffDate}`,
      "",
      "Ronica's Splendid Tours",
    ].join("\n"),
  });
}

export async function sendContactMessageNotification(details: {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
}) {
  const { user, notificationEmail } = getSmtpConfig();
  const transport = createTransport();
  const fullName = [details.firstName, details.lastName]
    .filter(Boolean)
    .join(" ");

  const lines = [
    "New contact form message received.",
    "",
    `Name: ${fullName}`,
    `Email: ${details.email}`,
    details.phone ? `Phone: ${details.phone}` : null,
    details.subject ? `Subject: ${details.subject}` : null,
    "",
    details.message ? `Message:\n${details.message}` : "Message: (none)",
  ].filter(Boolean);

  await transport.sendMail({
    from: `"Ronica's Splendid Tours" <${user}>`,
    to: notificationEmail,
    subject: details.subject
      ? `Contact form: ${details.subject}`
      : `Contact form message from ${fullName}`,
    text: lines.join("\n"),
  });
}
