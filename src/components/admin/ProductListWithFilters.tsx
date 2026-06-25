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

function categoryLabel(category: string) {
  return category === "taxi" ? "Taxi / Transfer" : "Tour";
}

function categoryBadgeClass(category: string) {
  return category === "taxi"
    ? "admin-badge admin-badge-taxi"
    : "admin-badge admin-badge-tour";
}

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

  const hasActiveFilters =
    query.trim() !== "" ||
    category !== "all" ||
    status !== "all" ||
    sort !== "title-asc";

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setStatus("all");
    setSort("title-asc");
  };

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-toolbar__top">
          <div>
            <p className="admin-toolbar__title">Filter products</p>
            <p className="admin-muted admin-toolbar__hint">
              Search, sort, and narrow the list below.
            </p>
          </div>
          <span className="admin-toolbar__count">
            {filtered.length} of {products.length}
          </span>
        </div>

        <div className="admin-filters">
          <label className="admin-filter-field admin-filter-search">
            <span>Search</span>
            <input
              type="search"
              placeholder="Name or slug..."
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
              <option value="all">All categories</option>
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
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label className="admin-filter-field">
            <span>Sort by</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="title-asc">Name (A–Z)</option>
              <option value="title-desc">Name (Z–A)</option>
              <option value="price-asc">Price (low to high)</option>
              <option value="price-desc">Price (high to low)</option>
            </select>
          </label>
        </div>

        {hasActiveFilters ? (
          <div className="admin-toolbar__footer">
            <button
              type="button"
              className="admin-btn admin-btn-ghost admin-btn-small"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </div>

      {!filtered.length ? (
        <div className="admin-empty-state">
          <p className="admin-empty-state__title">No products found</p>
          <p className="admin-muted">
            Try changing your search or filters to see more results.
          </p>
        </div>
      ) : (
        <div className="admin-product-table">
          <div className="admin-product-table__head" aria-hidden="true">
            <span>Product</span>
            <span>Category</span>
            <span>Price</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="admin-product-list">
            {filtered.map((product) => (
              <article key={product.slug} className="admin-product-row">
                <div className="admin-product-row__main">
                  <strong>{product.title}</strong>
                  <span className="admin-product-row__slug">{product.slug}</span>
                </div>

                <div className="admin-product-row__category">
                  <span className="admin-product-row__label">Category</span>
                  <span className={categoryBadgeClass(product.category)}>
                    {categoryLabel(product.category)}
                  </span>
                </div>

                <div className="admin-product-row__price">
                  <span className="admin-product-row__label">Price</span>
                  <strong>${Number(product.base_price).toFixed(2)}</strong>
                </div>

                <div className="admin-product-row__status">
                  <span className="admin-product-row__label">Status</span>
                  <span
                    className={
                      product.active
                        ? "admin-badge admin-badge-active"
                        : "admin-badge admin-badge-inactive"
                    }
                  >
                    {product.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="admin-product-row__actions">
                  <Link
                    href={`/admin/products/${product.slug}`}
                    className="admin-btn admin-btn-small admin-btn-secondary"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/product/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn admin-btn-small admin-btn-ghost"
                  >
                    View
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
