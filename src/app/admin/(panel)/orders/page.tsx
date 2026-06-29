import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import AdminOrderList from "@/components/admin/AdminOrderList";
import AdminPageTitle from "@/components/admin/AdminPageTitle";
import { OrdersIcon } from "@/components/admin/AdminIcons";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="admin-card">
        <AdminPageTitle icon={<OrdersIcon />}>Orders</AdminPageTitle>
        <p className="admin-error">
          Add Supabase keys to <code>.env.local</code> to use the admin panel.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const orderCount = orders?.length ?? 0;

  return (
    <div className="admin-card">
      <AdminPageTitle icon={<OrdersIcon />}>Orders</AdminPageTitle>

      <div className="admin-page-header">
        <p className="admin-muted admin-page-intro">
          All booking requests and paid PayPal orders appear here. Click a row to
          view full details.
        </p>
        {orderCount > 0 ? (
          <span className="admin-toolbar__count">
            {orderCount} order{orderCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="admin-error">
          Could not load orders. Run the SQL schema in Supabase and seed
          products first.
        </p>
      ) : null}

      {!orders?.length ? (
        <div className="admin-empty-state">
          <p className="admin-empty-state__title">No orders yet</p>
          <p className="admin-muted">
            New bookings from the website will show up here automatically.
          </p>
        </div>
      ) : (
        <AdminOrderList orders={orders} />
      )}
    </div>
  );
}
