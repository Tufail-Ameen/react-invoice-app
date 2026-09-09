import { Link } from "react-router-dom";
import { Can } from "../../auth/guards";
import { PERMISSIONS } from "../../lib/permissions";
import { formatPrice, productDefaultPrice } from "../../lib/rateLists";

export default function CatalogRatesCard({ products, isLoading }) {
  return (
    <section className="mb-4">
      <div className="rate-list-catalog-head">
        <div>
          <h2 className="product-list-heading mb-1">Default rate list</h2>
          <p className="textcklr small mb-0">
            These are the rates already set on products. Client lists start from this catalog.
          </p>
        </div>
        <Can permission={PERMISSIONS.RATE_LISTS_CREATE}>
          <Link to="/rate-lists/new" className="btn save-changes py-2 px-3">
            Use for a client
          </Link>
        </Can>
      </div>

      {isLoading ? (
        <p className="textcklr mb-0">Loading catalog…</p>
      ) : !products.length ? (
        <p className="textcklr small mb-0">Add product sale prices in Products &amp; Stock first.</p>
      ) : (
        <div className="form-card product-list-card">
          <div className="product-table-scroll rate-list-catalog-scroll">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Unit</th>
                  <th>Default rate</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.key || product.id}>
                    <td className="table-text-size">{product.name}</td>
                    <td className="cell-muted">{product.sku || "—"}</td>
                    <td className="cell-muted">{product.unit || "pcs"}</td>
                    <td className="price">{formatPrice(productDefaultPrice(product))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
