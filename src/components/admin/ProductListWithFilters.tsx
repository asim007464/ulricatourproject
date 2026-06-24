"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type AdminProductListItem = {
  slug: string;
  title: string;
  category: string;
  base_price: number;
  active: boolean;
};

type ProductListWithFiltersProps = {
  products: AdminProductListItem[];
};

export default function ProductListWithFilters({
  products,
}: ProductListWithFiltersProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("title-asc");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    let results = products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.slug.toLowerCase().includes(normalizedQuery);

      const matchesCategory =
        category === "all" || product.category === category;

      const matchesStatus =
        status === "all" ||
        (status === "active" && product.active) ||
        (status === "inactive" && !product.active);

      return matchesQuery && matchesCategory && matchesStatus;
    });

    results = [...results].sort((a, b) => {
      if (sort === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sort === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      if (sort === "price-asc") {
        return Number(a.base_price) - Number(b.base_price);
      }
      if (sort === "price-desc") {
        return Number(b.base_price) - Number(a.base_price);
      }
      return 0;
    });

    return results;
  }, [products, query, category, status, sort]);

  return (
    <>
      <div className="admin-filters">
        <label className="admin-filter-field admin-filter-search">
          <span>Search</span>
          <input
            type="search"
            placeholder="Search by name or slug..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="admin-filter-field">
          <span>Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All</option>
            <option value="taxi">Taxi / Transfer</option>
            <option value="tour">Tour</option>
          </select>
        </label>

        <label className="admin-filter-field">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label className="admin-filter-field">
          <span>Sort by</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="title-asc">Name (A–Z)</option>
            <option value="title-desc">Name (Z–A)</option>
            <option value="price-asc">Price (low to high)</option>
            <option value="price-desc">Price (high to low)</option>
          </select>
        </label>
      </div>

      <p className="admin-muted admin-filter-count">
        Showing {filtered.length} of {products.length} items
      </p>

      {!filtered.length ? (
        <p className="admin-muted">No products match your filters.</p>
      ) : (
        <div className="admin-product-list">
          {filtered.map((product) => (
            <div key={product.slug} className="admin-product-item">
              <div>
                <strong>{product.title}</strong>
                <div className="admin-muted">
                  {product.category} · ${Number(product.base_price).toFixed(2)}
                  {!product.active ? " · inactive" : ""}
                </div>
              </div>
              <div className="admin-product-actions">
                <Link href={`/admin/products/${product.slug}`}>Edit</Link>
                <Link
                  href={`/product/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
