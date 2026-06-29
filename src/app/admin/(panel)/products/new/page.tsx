import ProductCreateForm from "@/components/admin/ProductCreateForm";

export const dynamic = "force-dynamic";

export default function AdminProductCreatePage() {
  return (
    <div className="admin-card">
      <h1>Add product</h1>
      <p className="admin-muted">
        Create a new tour or transfer. A booking page is generated automatically.
      </p>
      <ProductCreateForm />
    </div>
  );
}
