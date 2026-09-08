import { formatPrice } from "../../lib/rateLists";
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
}) {
  return (
    <div className="rate-list-picker">
      <div className="form-card form-card-compact mb-3">
        <div className="grid grid-cols-12 items-end gap-2">
          <div className="col-span-12 md:col-span-7">
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
          <div className="col-span-12 md:col-span-5">
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
        </div>
      </div>

      {isLoading ? (
        <p className="textcklr">Loading products…</p>
      ) : !products.length ? (
        <EmptyState title="No products" message="No catalog items match this search." />
      ) : (
        <div className="form-card product-list-card">
          <div className="product-table-scroll">
            <table className="product-table rate-list-picker-table">
              <thead>
                <tr>
                  <th className="rate-list-check-col" aria-label="Select" />
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Default rate</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const id = String(product.id);
                  const isSelected = Boolean(selected[id]);
                  const defaultPrice =
                    selected[id]?.defaultPrice ??
                    product.salePrice ??
                    product.printRate ??
                    product.price ??
                    0;
                  return (
                    <tr
                      key={product.key || id}
                      className={isSelected ? "rate-list-row-selected" : undefined}
                      onClick={() => onToggle(product)}
                    >
                      <td className="rate-list-check-col">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => onToggle(product)}
                          aria-label={`Select ${product.name}`}
                        />
                      </td>
                      <td className="table-text-size">{product.name}</td>
                      <td className="cell-muted">{product.sku || "—"}</td>
                      <td className="price">{formatPrice(defaultPrice)}</td>
                      <td className="cell-muted">{product.unit || "pcs"}</td>
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
