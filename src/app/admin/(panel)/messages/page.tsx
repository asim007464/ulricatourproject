import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { updateContactMessageStatusAction } from "../../actions";
import AdminPageTitle from "@/components/admin/AdminPageTitle";
import { MessagesIcon } from "@/components/admin/AdminIcons";
import type { DbContactMessage } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function statusBadgeClass(status: DbContactMessage["status"]) {
  if (status === "new") return "admin-badge admin-badge-request";
  if (status === "read") return "admin-badge admin-badge-paid";
  return "admin-badge admin-badge-pending";
}

function formatName(message: DbContactMessage) {
  return [message.first_name, message.last_name].filter(Boolean).join(" ");
}

export default async function AdminMessagesPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="admin-card">
        <AdminPageTitle icon={<MessagesIcon />}>Messages</AdminPageTitle>
        <p className="admin-error">
          Add Supabase keys to <code>.env.local</code> to use the admin panel.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: messages, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  const newCount =
    messages?.filter((message) => message.status === "new").length || 0;

  return (
    <div className="admin-card">
      <AdminPageTitle icon={<MessagesIcon />}>Messages</AdminPageTitle>
      <p className="admin-muted">
        Contact form submissions from the website appear here.
        {newCount ? ` ${newCount} new message${newCount === 1 ? "" : "s"}.` : ""}
      </p>

      {error ? (
        <p className="admin-error">
          Could not load messages. Run the latest SQL migration in Supabase
          (<code>006_contact_messages.sql</code>).
        </p>
      ) : null}

      {!messages?.length ? (
        <p className="admin-muted">No messages yet.</p>
      ) : (
        <div className="admin-message-list">
          {(messages as DbContactMessage[]).map((message) => (
            <article
              key={message.id}
              className={`admin-message-card${
                message.status === "new" ? " admin-message-card--new" : ""
              }`}
            >
              <div className="admin-message-card__header">
                <div>
                  <h2>{formatName(message)}</h2>
                  <p className="admin-muted">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={statusBadgeClass(message.status)}>
                  {message.status}
                </span>
              </div>

              <div className="admin-message-card__meta">
                <div>
                  <strong>Email</strong>
                  <a href={`mailto:${message.email}`}>{message.email}</a>
                </div>
                {message.phone ? (
                  <div>
                    <strong>Phone</strong>
                    <a href={`tel:${message.phone}`}>{message.phone}</a>
                  </div>
                ) : null}
                {message.subject ? (
                  <div>
                    <strong>Subject</strong>
                    <span>{message.subject}</span>
                  </div>
                ) : null}
              </div>

              {message.message ? (
                <div className="admin-message-card__body">
                  <strong>Message</strong>
                  <p>{message.message}</p>
                </div>
              ) : null}

              <form
                action={updateContactMessageStatusAction}
                className="admin-message-card__actions"
              >
                <input type="hidden" name="message_id" value={message.id} />
                <select name="status" defaultValue={message.status}>
                  <option value="new">new</option>
                  <option value="read">read</option>
                  <option value="archived">archived</option>
                </select>
                <button type="submit" className="admin-btn admin-btn-secondary">
                  Update status
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
