"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className={`admin-layout${
        sidebarOpen ? " admin-layout--sidebar-open" : ""
      }`}
    >
      <div
        role="button"
        tabIndex={-1}
        className="admin-overlay"
        aria-label="Close menu"
        aria-hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setSidebarOpen(false);
          }
        }}
      />
      <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
      <div className="admin-content-wrap">
        <header className="admin-mobile-header">
          <button
            type="button"
            className="admin-mobile-menu-btn"
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <span className="admin-mobile-title">Admin Panel</span>
        </header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
