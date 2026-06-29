"use client";

import { useState } from "react";
import { updateOrderStatusAction } from "@/app/admin/actions";
import type { DbOrder } from "@/lib/supabase/types";

type AdminOrderListProps = {
  orders: DbOrder[];
};

function orderStatusBadgeClass(status: string) {
  if (status === "confirmed" || status === "paid") {
    return "admin-badge admin-badge-paid";
  }
  if (status === "cancelled") return "admin-badge admin-badge-inactive";
  if (status === "request") return "admin-badge admin-badge-request";
  return "admin-badge admin-badge-pending";
}

function formatOrderDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function formatAmount(amount: number | null, currency = "USD") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amount));
}

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function AdminOrderList({ orders }: AdminOrderListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="admin-order-table">
      <div className="admin-order-table__head">
        <span aria-hidden="true" />
        <span>Order</span>
        <span>Date</span>
        <span>Amount</span>
        <span>Status</span>
      </div>

      {orders.map((order) => {
        const isOpen = openId === order.id;
        const hasCustomer =
          order.customer_name ||
          order.customer_email ||
          order.customer_phone ||
          order.customer_address;
        const typeDiffersFromStatus = order.order_type !== order.status;

        return (
          <article
            key={order.id}
            className={`admin-order-item${isOpen ? " admin-order-item--open" : ""}`}
          >
            <button
              type="button"
              className="admin-order-summary"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : order.id)}
            >
              <span className="admin-order-summary__chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M9 6l6 6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="admin-order-summary__product">
                <strong>{order.product_title}</strong>
                <span className="admin-order-summary__meta">
                  {order.guests} guest{order.guests === 1 ? "" : "s"} · Pick-up{" "}
                  {order.pickup_date}
                </span>
              </span>
              <span className="admin-order-summary__date">
                <time dateTime={order.created_at}>
                  {formatOrderDate(order.created_at)}
                </time>
              </span>
              <span className="admin-order-summary__amount">
                <strong>{formatAmount(order.amount, order.currency)}</strong>
              </span>
              <span className="admin-order-summary__status">
                <span className={orderStatusBadgeClass(order.status)}>
                  {formatLabel(order.status)}
                </span>
              </span>
            </button>

            {isOpen ? (
              <div className="admin-order-details">
                <div className="admin-order-details__grid">
                  <section className="admin-order-details__section">
                    <h3>Customer</h3>
                    {hasCustomer ? (
                      <dl className="admin-order-details__list">
                        {order.customer_name ? (
                          <>
                            <dt>Name</dt>
                            <dd>{order.customer_name}</dd>
                          </>
                        ) : null}
                        {order.customer_email ? (
                          <>
                            <dt>Email</dt>
                            <dd>
                              <a href={`mailto:${order.customer_email}`}>
                                {order.customer_email}
                              </a>
                            </dd>
                          </>
                        ) : null}
                        {order.customer_phone ? (
                          <>
                            <dt>Phone</dt>
                            <dd>
                              <a href={`tel:${order.customer_phone}`}>
                                {order.customer_phone}
                              </a>
                            </dd>
                          </>
                        ) : null}
                        {order.customer_address ? (
                          <>
                            <dt>Address</dt>
                            <dd>{order.customer_address}</dd>
                          </>
                        ) : null}
                      </dl>
                    ) : (
                      <p className="admin-muted">No contact details</p>
                    )}
                  </section>

                  <section className="admin-order-details__section">
                    <h3>Trip</h3>
                    <dl className="admin-order-details__list">
                      <dt>Pick-up</dt>
                      <dd>{order.pickup_date}</dd>
                      <dt>Drop-off</dt>
                      <dd>{order.dropoff_date}</dd>
                      <dt>Guests</dt>
                      <dd>{order.guests}</dd>
                      {order.departure_location ? (
                        <>
                          <dt>From</dt>
                          <dd>{order.departure_location}</dd>
                        </>
                      ) : null}
                    </dl>
                  </section>

                  <section className="admin-order-details__section">
                    <h3>Booking</h3>
                    <dl className="admin-order-details__list">
                      <dt>Type</dt>
                      <dd>{formatLabel(order.order_type)}</dd>
                      <dt>Product slug</dt>
                      <dd>
                        <code>{order.product_slug}</code>
                      </dd>
                      {order.paypal_order_id ? (
                        <>
                          <dt>PayPal ID</dt>
                          <dd>
                            <code>{order.paypal_order_id}</code>
                          </dd>
                        </>
                      ) : null}
                    </dl>
                    {order.customer_message ? (
                      <div className="admin-order-details__message">
                        <span className="admin-order-details__message-label">
                          Customer note
                        </span>
                        <p>{order.customer_message}</p>
                      </div>
                    ) : null}
                  </section>
                </div>

                <div className="admin-order-details__footer">
                  <div className="admin-order-details__status">
                    <span className={orderStatusBadgeClass(order.status)}>
                      {formatLabel(order.status)}
                    </span>
                    {typeDiffersFromStatus ? (
                      <span className="admin-order-row__type-hint">
                        {formatLabel(order.order_type)} booking
                      </span>
                    ) : null}
                  </div>
                  <form
                    action={updateOrderStatusAction}
                    className="admin-order-status-form"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input type="hidden" name="order_id" value={order.id} />
                    <label className="admin-order-status-form__label">
                      <span>Update status</span>
                      <select name="status" defaultValue={order.status}>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="request">Request</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </label>
                    <button
                      type="submit"
                      className="admin-btn admin-btn-success admin-btn-small"
                    >
                      Save
                    </button>
                  </form>
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
