import type { Metadata, Viewport } from "next";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import {
  conditionalStylesheets,
  siteFonts,
  siteStylesheets,
} from "@/lib/site-styles";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Ronica's Splendid Tours & Transfers",
  description:
    "Discover Jamaica with confidence and ease. Professional drivers, transparent pricing, and stress-free travel.",
  icons: {
    icon: [
      {
        url: "/wp-content/uploads/2026/02/cropped-vehicle-sedan-6YdpJ6Ah-32x32.jpg",
        sizes: "32x32",
      },
      {
        url: "/wp-content/uploads/2026/02/cropped-vehicle-sedan-6YdpJ6Ah-192x192.jpg",
        sizes: "192x192",
      },
    ],
    apple:
      "/wp-content/uploads/2026/02/cropped-vehicle-sedan-6YdpJ6Ah-180x180.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US">
      <head>
        <link
          rel="preload"
          href="/wp-content/plugins/jeg-elementor-kit/assets/fonts/jkiticon/jkiticon.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {siteFonts.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        {siteStylesheets.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        {conditionalStylesheets.map(({ href, media }) => (
          <link key={href} rel="stylesheet" href={href} media={media} />
        ))}
      </head>
      <body suppressHydrationWarning>
        {children}
        <WhatsAppWidget />
      </body>
    </html>
  );
}
