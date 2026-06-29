function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPayPalConfig() {
  return {
    mode: process.env.PAYPAL_MODE === "live" ? "live" : "sandbox",
    clientId: required("PAYPAL_CLIENT_ID"),
    clientSecret: required("PAYPAL_CLIENT_SECRET"),
    apiBase:
      process.env.PAYPAL_MODE === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com",
  };
}

export function getSmtpConfig() {
  return {
    user: required("SMTP_USER"),
    password: required("SMTP_APP_PASSWORD"),
    notificationEmail:
      process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER || "",
  };
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
