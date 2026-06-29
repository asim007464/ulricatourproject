import { notFound } from "next/navigation";
import type { Metadata } from "next";
import RonicasPage from "@/components/RonicasPage";
import { getProductBodyHtml } from "@/lib/content";
import {
  getPostIdFromBodyClass,
  getProductPricingAsync,
  resolveProductForPage,
} from "@/lib/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const pricing = await getProductPricingAsync(slug);
    return {
      title: `${pricing.title} – Ronica's Splendid Tours & Transfers`,
      description: pricing.title,
    };
  } catch {
    return {};
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await resolveProductForPage(slug);
  if (!product) notFound();

  const pricing = await getProductPricingAsync(slug);
  const wordpressId =
    product.wordpressId || getPostIdFromBodyClass(product.bodyClass);
  const bodyHtml = await getProductBodyHtml(slug, pricing, wordpressId);

  if (!bodyHtml) notFound();

  return (
    <RonicasPage
      bodyHtml={bodyHtml}
      bodyClassName={product.bodyClass}
      loadBookingScripts
    />
  );
}
