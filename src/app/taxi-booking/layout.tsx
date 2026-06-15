import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Taxi Booking – Ronica's Splendid Tours & Transfers",
  description:
    "Private airport transfers from Sangster International Airport (MBJ). Fixed pricing, no surprises.",
};

export default function TransportationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
