import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us – Ronica's Splendid Tours & Transfers",
  description:
    "Get in touch with Ronica's Splendid Tours & Transfers for tours, airport transfers, and travel questions in Jamaica.",
};

export default function ContactLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
