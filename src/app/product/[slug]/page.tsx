import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import RonicasPage from "@/components/RonicasPage";
import taxiManifest from "@/content/taxi-products-manifest.json";
import tourManifest from "@/content/tour-products-manifest.json";

type ProductEntry = {
  slug: string;
  title: string;
  bodyClass: string;
};

const products = [
  ...(taxiManifest.products as ProductEntry[]),
  ...(tourManifest.products as ProductEntry[]),
];

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((entry) => entry.slug === slug);
  if (!product) return {};

  return {
    title: `${product.title} – Ronica's Splendid Tours & Transfers`,
    description: product.title,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products.find((entry) => entry.slug === slug);
  if (!product) notFound();

  const bodyPath = path.join(process.cwd(), "src/content/products", `${slug}.html`);
  if (!fs.existsSync(bodyPath)) notFound();

  const bodyHtml = fs.readFileSync(bodyPath, "utf8");

  return (
    <RonicasPage
      bodyHtml={bodyHtml}
      bodyClassName={product.bodyClass}
      loadBookingScripts
    />
  );
}
