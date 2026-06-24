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
        <h1>Admin Login</h1>
        <p className="admin-muted">
          Sign in with your Supabase admin account.
        </p>
        <LoginForm nextPath={params.next || "/admin/orders"} />
      </div>
    </div>
  );
}
