import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import ProductListWithFilters from "@/components/admin/ProductListWithFilters";
import AdminPageTitle from "@/components/admin/AdminPageTitle";
import { ProductsIcon } from "@/components/admin/AdminIcons";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="admin-card">
        <AdminPageTitle icon={<ProductsIcon />}>Travels / Taxi</AdminPageTitle>
        <p className="admin-error">
          Add Supabase keys to <code>.env.local</code> to use the admin panel.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("slug, title, category, base_price, active")
    .order("category")
    .order("title");

  return (
    <div className="admin-card">
      <AdminPageTitle icon={<ProductsIcon />}>Travels / Taxi</AdminPageTitle>
      <div className="admin-page-header">
        <p className="admin-muted">
          Add, edit, or delete tours and transfers. Changes apply to new bookings
          immediately.
        </p>
        <Link href="/admin/products/new" className="admin-btn">
          Add product
        </Link>
      </div>

      {error ? (
        <p className="admin-error">
          Could not load products. Run <code>npm run seed:supabase</code> after
          setting up Supabase.
        </p>
      ) : null}

      {!products?.length ? (
        <p className="admin-muted">
          No products yet. Click <strong>Add product</strong> to create one.
        </p>
      ) : (
        <ProductListWithFilters products={products} />
      )}
    </div>
  );
}
