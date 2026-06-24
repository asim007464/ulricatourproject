"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncFormPricingInHtml } from "@/lib/content";
import { syncProductImageInHtml, extractProductImageUrl } from "@/lib/product-image";
import {
  buildProductHtml,
  generateWordpressId,
  slugifyTitle,
} from "@/lib/product-template";
import type { DbProduct } from "@/lib/supabase/types";

export async function loginAction(formData: FormData) {
  const email = formData.get("email")?.toString().trim() || "";
  const password = formData.get("password")?.toString() || "";
  const next = formData.get("next")?.toString() || "/admin/orders";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(next);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateProductAction(formData: FormData) {
  const slug = formData.get("slug")?.toString() || "";
  const title = formData.get("title")?.toString().trim() || "";
  const description = formData.get("description")?.toString() || "";
  const bodyHtml = formData.get("body_html")?.toString() || "";
  const imageUrl = formData.get("image_url")?.toString().trim() || "";
  const basePrice = Number(formData.get("base_price") || 0);
  const basePaxLimit = Number(formData.get("base_pax_limit") || 4);
  const extraSurcharge = Number(formData.get("extra_surcharge") || 0);
  const maxSeats = Number(formData.get("max_seats") || 6);
  const minPax = Number(formData.get("min_pax") || 1);
  const active = formData.get("active") === "on";
  const locationsRaw = formData.get("locations")?.toString() || "[]";

  if (!slug || !title) {
    return { error: "Slug and title are required." };
  }

  let locations = [];
  try {
    locations = JSON.parse(locationsRaw);
  } catch {
    return { error: "Locations must be valid JSON." };
  }

  const supabase = await createClient();

  const pricing = {
    slug,
    title,
    basePrice,
    basePaxLimit,
    extraSurcharge,
    maxSeats,
    minPax,
    rentalType: formData.get("rental_type")?.toString() || "tour",
    locations,
  };

  const { data: existing } = await supabase
    .from("products")
    .select("wordpress_id, body_html, image_url")
    .eq("slug", slug)
    .maybeSingle();

  const baseHtml = bodyHtml || existing?.body_html || "";
  let syncedBodyHtml = baseHtml
    ? syncFormPricingInHtml(
        baseHtml,
        pricing,
        (existing as DbProduct | null)?.wordpress_id
      )
    : null;

  if (syncedBodyHtml && imageUrl) {
    syncedBodyHtml = syncProductImageInHtml(
      syncedBodyHtml,
      imageUrl,
      existing?.image_url || extractProductImageUrl(baseHtml)
    );
  }

  const { error } = await supabase
    .from("products")
    .update({
      title,
      description,
      body_html: syncedBodyHtml,
      image_url: imageUrl || null,
      base_price: basePrice,
      base_pax_limit: basePaxLimit,
      extra_surcharge: extraSurcharge,
      max_seats: maxSeats,
      min_pax: minPax,
      active,
      locations,
    })
    .eq("slug", slug);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${slug}`);
  revalidatePath(`/product/${slug}`);
  revalidatePath("/taxi-booking");
  revalidatePath("/tours");
  return { success: true };
}

export async function updateSitePageAction(formData: FormData) {
  const slug = formData.get("slug")?.toString() || "";
  const title = formData.get("title")?.toString().trim() || "";
  const heroTitle = formData.get("hero_title")?.toString().trim() || "";
  const heroDescription = formData.get("hero_description")?.toString().trim() || "";
  const bodyHtml = formData.get("body_html")?.toString() || "";

  if (!slug || !title || !bodyHtml) {
    return { error: "Title and page content are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_pages")
    .update({
      title,
      hero_title: heroTitle,
      hero_description: heroDescription,
      body_html: bodyHtml,
    })
    .eq("slug", slug);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${slug}`);
  if (slug === "taxi-booking") {
    revalidatePath("/taxi-booking");
  }
  if (slug === "tours") {
    revalidatePath("/tours");
  }
  return { success: true };
}

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const orderId = formData.get("order_id")?.toString() || "";
  const status = formData.get("status")?.toString() || "";

  if (!orderId || !status) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    console.error("Failed to update order:", error.message);
    return;
  }

  revalidatePath("/admin/orders");
}

export async function createProductAction(formData: FormData) {
  const title = formData.get("title")?.toString().trim() || "";
  const slugInput = formData.get("slug")?.toString().trim() || "";
  const category = formData.get("category")?.toString() as "taxi" | "tour";
  const description = formData.get("description")?.toString() || "";
  const imageUrl = formData.get("image_url")?.toString().trim() || "";
  const basePrice = Number(formData.get("base_price") || 0);
  const basePaxLimit = Number(formData.get("base_pax_limit") || 4);
  const extraSurcharge = Number(formData.get("extra_surcharge") || 0);
  const maxSeats = Number(formData.get("max_seats") || 6);
  const minPax = Number(formData.get("min_pax") || 1);
  const active = formData.get("active") === "on";
  const locationsRaw = formData.get("locations")?.toString() || "[]";

  if (!title || !category) {
    return { error: "Title and category are required." };
  }

  const slug = slugInput || slugifyTitle(title);
  if (!slug) {
    return { error: "Could not generate a valid slug." };
  }

  let locations = [];
  try {
    locations = JSON.parse(locationsRaw);
  } catch {
    return { error: "Locations must be valid JSON." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return { error: "A product with this slug already exists." };
  }

  const wordpressId = generateWordpressId();
  const rentalType = category === "taxi" ? "taxi" : "tour";
  const pricing = {
    slug,
    title,
    basePrice,
    basePaxLimit,
    extraSurcharge,
    maxSeats,
    minPax,
    rentalType,
    locations,
  };

  const bodyHtml = buildProductHtml({
    category,
    slug,
    title,
    wordpressId,
    pricing,
    description,
    imageUrl: imageUrl || undefined,
  });

  const { error } = await supabase.from("products").insert({
    slug,
    wordpress_id: wordpressId,
    title,
    category,
    description,
    body_html: bodyHtml,
    image_url: imageUrl || null,
    base_price: basePrice,
    base_pax_limit: basePaxLimit,
    extra_surcharge: extraSurcharge,
    max_seats: maxSeats,
    min_pax: minPax,
    duration_days: 1,
    rental_type: rentalType,
    locations,
    active,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/taxi-booking");
  revalidatePath("/tours");
  redirect(`/admin/products/${slug}`);
}

export async function deleteProductAction(formData: FormData) {
  const slug = formData.get("slug")?.toString() || "";

  if (!slug) {
    return { error: "Missing product slug." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("slug", slug);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/taxi-booking");
  revalidatePath("/tours");
  redirect("/admin/products");
}
