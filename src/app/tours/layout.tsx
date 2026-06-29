import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tours – Ronica's Splendid Tours & Transfers",
  description:
    "Explore Jamaica's most beautiful destinations with our curated selection of private tours and day trips.",
};

export default function ToursLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
