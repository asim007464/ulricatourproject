"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { LogoutIcon, OrdersIcon, PagesIcon, ProductsIcon, WebsiteIcon } from "@/components/admin/AdminIcons";

type AdminSidebarProps = {
  onNavigate?: () => void;
};

const NAV_ITEMS = [
  { href: "/admin/orders", label: "Orders", icon: "orders" },
  { href: "/admin/products", label: "Travels / Taxi", icon: "products" },
  { href: "/admin/pages", label: "Pages", icon: "pages" },
] as const;

const NAV_ICONS = {
  orders: OrdersIcon,
  products: ProductsIcon,
  pages: PagesIcon,
} as const;

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/orders") {
      return pathname === "/admin" || pathname === "/admin/orders";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="admin-sidebar" aria-label="Admin navigation">
      <div className="admin-sidebar__brand">
        <Link href="/admin/orders" className="admin-sidebar__logo" onClick={onNavigate}>
          <img
            src="/wp-content/uploads/2026/02/RONICAS-LOGO-BLACK-AND-GOLD.gif"
            alt="Ronica's Splendid Tours"
            width={48}
            height={48}
          />
          <div>
            <strong>Ronica&apos;s</strong>
            <span>Admin Panel</span>
          </div>
        </Link>
      </div>

      <nav className="admin-sidebar__nav">
        <p className="admin-sidebar__section">Manage</p>
        {NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.icon];

          return (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-sidebar__link${
              isActive(item.href) ? " admin-sidebar__link--active" : ""
            }`}
            onClick={onNavigate}
          >
            <span className="admin-sidebar__icon">
              <Icon />
            </span>
            {item.label}
          </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar__footer">
        <Link
          href="/"
          className="admin-sidebar__link admin-sidebar__link--muted"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
        >
          <span className="admin-sidebar__icon">
            <WebsiteIcon />
          </span>
          View website
        </Link>
        <form action={logoutAction} className="admin-sidebar__logout">
          <button type="submit" className="admin-sidebar__link admin-sidebar__link--logout">
            <span className="admin-sidebar__icon">
              <LogoutIcon />
            </span>
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
