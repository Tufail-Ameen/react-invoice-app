import { useEffect, useMemo, useRef } from "react";
import { formatDelta, formatPrice, productDefaultPrice } from "../../lib/rateLists";
import EmptyState from "../ui/EmptyState";

export default function ProductPicker({
  products,
  isLoading,
  search,
  categoryId,
  categories,
  selected,
  onSearch,
  onCategory,
  onToggle,
  onToggleVisible,
  onSetRate,
}) {
  const headerCheckRef = useRef(null);
  const visibleIds = useMemo(() => products.map((product) => String(product.id)), [products]);
  const selectedVisible = visibleIds.filter((id) => selected[id]).length;
  const allVisibleSelected = products.length > 0 && selectedVisible === products.length;
  const someVisibleSelected = selectedVisible > 0 && !allVisibleSelected;

  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  return (
    <div className="rate-list-picker">
      <div className="form-card form-card-compact mb-3">
        <div className="grid grid-cols-12 items-end gap-2">
          <div className="col-span-12 md:col-span-6">
            <label className="form-label input-clr mb-1" htmlFor="rate-list-product-search">
              Search
            </label>
            <input
              id="rate-list-product-search"
              className="form-control input-settings input-compact"
              placeholder="Name or SKU…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <div className="col-span-12 md:col-span-3">
            <label className="form-label input-clr mb-1" htmlFor="rate-list-product-category">
              Category
            </label>
            <select
              id="rate-list-product-category"
              className="form-select input-settings input-compact"
              value={categoryId}
              onChange={(e) => onCategory(e.target.value)}
            >
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-3">
            <button
              type="button"
              className="btn save py-2 px-3 w-full md:mt-0"
              disabled={!products.length}
              onClick={() => onToggleVisible(products, !allVisibleSelected)}
            >
              {allVisibleSelected ? "Clear visible" : "Add all visible"}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="textcklr">Loading products…</p>
      ) : !products.length ? (
        <EmptyState title="No products" message="No catalog items match this search." />
      ) : (
        <div className="form-card product-list-card">
          <div className="product-table-scroll">
            <table className="product-table rate-list-sheet-table">
              <thead>
                <tr>
                  <th className="rate-list-check-col">
                    <input
                      ref={headerCheckRef}
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={() => onToggleVisible(products, !allVisibleSelected)}
                      aria-label="Select all visible products"
                    />
                  </th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Default rate</th>
                  <th>Custom rate</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const id = String(product.id);
                  const isSelected = Boolean(selected[id]);
                  const defaultPrice = selected[id]?.defaultPrice ?? productDefaultPrice(product);
                  const customPrice = isSelected ? selected[id].customPrice : defaultPrice;
                  const delta = formatDelta(customPrice, defaultPrice);
                  return (
                    <tr
                      key={product.key || id}
                      className={isSelected ? "rate-list-row-selected" : undefined}
                    >
                      <td className="rate-list-check-col">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggle(product)}
                          aria-label={`Select ${product.name}`}
                        />
                      </td>
                      <td className="table-text-size">
                        {product.name}
                        <div className="cell-muted small">{product.unit || "pcs"}</div>
                      </td>
                      <td className="cell-muted">{product.sku || "—"}</td>
                      <td className="price">{formatPrice(defaultPrice)}</td>
                      <td className="rate-list-custom-col">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control input-settings input-compact rate-list-rate-input"
                          value={customPrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              onSetRate(product, "");
                              return;
                            }
                            const n = Number(value);
                            if (!Number.isFinite(n) || n < 0) return;
                            onSetRate(product, n);
                          }}
                          aria-label={`Custom rate for ${product.name}`}
                        />
                      </td>
                      <td className={`rate-delta rate-delta-${delta.tone}`}>
                        {isSelected ? delta.text : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
