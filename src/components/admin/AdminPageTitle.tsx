import type { ReactNode } from "react";

export default function AdminPageTitle({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <h1 className="admin-page-title">
      <span className="admin-page-title__icon" aria-hidden="true">
        {icon}
      </span>
      {children}
    </h1>
  );
}
