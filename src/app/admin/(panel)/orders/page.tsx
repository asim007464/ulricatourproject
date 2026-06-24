import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { updateOrderStatusAction } from "../../actions";

export const dynamic = "force-dynamic";

function badgeClass(orderType: string) {
  if (orderType === "paid") return "admin-badge admin-badge-paid";
  if (orderType === "request") return "admin-badge admin-badge-request";
  return "admin-badge admin-badge-pending";
}

export default async function AdminOrdersPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="admin-card">
        <h1>Orders</h1>
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

  return (
    <div className="admin-card">
      <h1>Orders</h1>
      <p className="admin-muted">
        All booking requests and paid PayPal orders appear here.
      </p>

      {error ? (
        <p className="admin-error">
          Could not load orders. Run the SQL schema in Supabase and seed
          products first.
        </p>
      ) : null}

      {!orders?.length ? (
        <p className="admin-muted">No orders yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Customer</th>
              <th>Trip</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td>{order.product_title}</td>
                <td>
                  <div>{order.customer_name || "—"}</div>
                  <div className="admin-muted">{order.customer_email || ""}</div>
                  <div className="admin-muted">{order.customer_phone || ""}</div>
                </td>
                <td>
                  <div>Pick-up: {order.pickup_date}</div>
                  <div>Drop-off: {order.dropoff_date}</div>
                  <div>Guests: {order.guests}</div>
                  {order.departure_location ? (
                    <div>From: {order.departure_location}</div>
                  ) : null}
                </td>
                <td>
                  {order.amount != null
                    ? `$${Number(order.amount).toFixed(2)}`
                    : "—"}
                </td>
                <td>
                  <span className={badgeClass(order.order_type)}>
                    {order.order_type}
                  </span>
                </td>
                <td>
                  <form action={updateOrderStatusAction} className="admin-form">
                    <input type="hidden" name="order_id" value={order.id} />
                    <select name="status" defaultValue={order.status}>
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                      <option value="request">request</option>
                      <option value="confirmed">confirmed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    <button type="submit" className="admin-btn admin-btn-secondary">
                      Update
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
