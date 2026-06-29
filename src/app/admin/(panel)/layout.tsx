import AdminShell from "@/components/admin/AdminShell";
import "../admin.css";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
