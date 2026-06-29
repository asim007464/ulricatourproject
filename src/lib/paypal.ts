import { getPayPalConfig } from "@/lib/env";

type PayPalAccessToken = {
  access_token: string;
};

export type BookingDetails = {
  productSlug: string;
  productTitle: string;
  pickupDate: string;
  dropoffDate: string;
  guests: number;
  departureLocation?: string;
  amount: number;
};

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, apiBase } = getPayPalConfig();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = (await response.json()) as PayPalAccessToken;
  return data.access_token;
}

export async function createPayPalOrder(booking: BookingDetails) {
  const { apiBase } = getPayPalConfig();
  const accessToken = await getAccessToken();

  const response = await fetch(`${apiBase}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: booking.amount.toFixed(2),
          },
          description: booking.productTitle,
          custom_id: JSON.stringify({
            productSlug: booking.productSlug,
            pickupDate: booking.pickupDate,
            dropoffDate: booking.dropoffDate,
            guests: booking.guests,
            departureLocation: booking.departureLocation || "",
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal create order failed: ${error}`);
  }

  return response.json() as Promise<{ id: string }>;
}

export async function capturePayPalOrder(orderId: string) {
  const { apiBase } = getPayPalConfig();
  const accessToken = await getAccessToken();

  const response = await fetch(
    `${apiBase}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal capture failed: ${error}`);
  }

  return response.json();
}
