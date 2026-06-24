import Link from "next/link";
import { logoutAction } from "../actions";
import "../admin.css";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">Ronica&apos;s Admin</div>
        <nav className="admin-nav">
          <Link className="admin-nav-link" href="/admin/orders">
            Orders
          </Link>
          <Link className="admin-nav-link" href="/admin/products">
            Travels / Taxi
          </Link>
          <Link className="admin-nav-link" href="/admin/pages">
            Pages
          </Link>
          <Link className="admin-nav-link" href="/">
            View site
          </Link>
          <form action={logoutAction} className="admin-nav-form">
            <button type="submit" className="admin-nav-link">
              Logout
            </button>
          </form>
        </nav>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
