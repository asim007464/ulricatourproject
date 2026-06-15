import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us – Ronica's Splendid Tours & Transfers",
  description:
    "Learn about Ronica's Splendid Tours & Transfers — passionate Jamaican hosts offering safe, personal tours and airport transfers.",
};

export default function AboutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
