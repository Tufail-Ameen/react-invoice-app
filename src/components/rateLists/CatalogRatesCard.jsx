import { formatPrice, productDefaultPrice, splitCatalogColumns } from "../../lib/rateLists";
import EmptyState from "../ui/EmptyState";

function CatalogColumn({ products }) {
  return (
    <table className="product-table w-full !min-w-0 border-separate border-spacing-0">
      <thead>
        <tr>
          <th className="border-0 border-b border-solid border-[#d4cfc4] text-left">Product</th>
          <th className="w-16 border-0 border-b border-solid border-[#d4cfc4] text-left">Unit</th>
          <th className="w-24 border-0 border-b border-solid border-[#d4cfc4] text-left">Rate</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.key || product.id}>
            <td className="table-text-size border-0 border-b border-solid border-[#d4cfc4] text-left">
              {product.name}
            </td>
            <td className="cell-muted border-0 border-b border-solid border-[#d4cfc4] text-left">
              {product.unit || "pcs"}
            </td>
            <td className="price whitespace-nowrap border-0 border-b border-solid border-[#d4cfc4] text-left">
              {formatPrice(productDefaultPrice(product))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CatalogRatesCard({ products, isLoading }) {
  let body = null;
  if (isLoading) {
    body = <p className="textcklr m-0 px-4 py-5">Loading catalog…</p>;
  } else if (!products.length) {
    body = (
      <EmptyState
        className="!border-0 !bg-transparent !shadow-none"
        title="No catalog rates"
        message="Add product sale prices in Products & Stock first."
      />
    );
  } else {
    const { left, right } = splitCatalogColumns(products);
    body = (
      <div className="flex flex-col md:flex-row">
        <div className="min-w-0 flex-1">
          <CatalogColumn products={left} />
        </div>
        {right.length ? (
          <>
            <div
              className="h-px w-full shrink-0 bg-[var(--color-border-strong)] md:h-auto md:min-h-full md:w-[2px] md:self-stretch"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <CatalogColumn products={right} />
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="form-card product-list-card client-list-card">
      <div className="product-table-scroll client-table-scroll">{body}</div>
    </div>
  );
}
