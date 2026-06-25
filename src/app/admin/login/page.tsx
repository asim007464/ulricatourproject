import LoginForm from "@/components/admin/LoginForm";
import "../admin.css";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <img
            src="/wp-content/uploads/2026/02/RONICAS-LOGO-BLACK-AND-GOLD.gif"
            alt="Ronica's Splendid Tours"
            width={72}
            height={72}
          />
          <div>
            <h1>Admin Login</h1>
            <p className="admin-muted">
              Sign in to manage orders, tours, and transfers.
            </p>
          </div>
        </div>
        <LoginForm nextPath={params.next || "/admin/orders"} />
      </div>
    </div>
  );
}
