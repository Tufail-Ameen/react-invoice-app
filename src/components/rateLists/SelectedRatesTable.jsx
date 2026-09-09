import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDelta, formatPrice } from "../../lib/rateLists";

export default function SelectedRatesTable({
  items,
  onChangePrice,
  onRemove,
  readOnly = false,
  showDifference = true,
}) {
  if (!items.length) {
    return (
      <p className="textcklr small mb-0">Included products for this client.</p>
    );
  }

  return (
    <div className="product-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Default</th>
            <th>Custom rate</th>
            {showDifference && <th>Difference</th>}
            {!readOnly && <th className="text-end"> </th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const delta = formatDelta(item.customPrice, item.defaultPrice);
            return (
              <tr key={String(item.productId)}>
                <td>
                  <div className="table-text-size">{item.productName}</div>
                  <div className="cell-muted small">
                    {item.sku ? `${item.sku} · ` : ""}
                    {item.unit || "pcs"}
                  </div>
                </td>
                <td className="cell-muted">{formatPrice(item.defaultPrice)}</td>
                <td>
                  {readOnly ? (
                    <span className="price">{formatPrice(item.customPrice)}</span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control input-settings input-compact"
                      value={item.customPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          onChangePrice(item.productId, "");
                          return;
                        }
                        const n = Number(value);
                        if (!Number.isFinite(n) || n < 0) return;
                        onChangePrice(item.productId, n);
                      }}
                      aria-label={`Custom rate for ${item.productName}`}
                    />
                  )}
                </td>
                {showDifference && (
                  <td className={`rate-delta rate-delta-${delta.tone}`}>{delta.text}</td>
                )}
                {!readOnly && (
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn cancel py-1 px-2"
                      onClick={() => onRemove(item.productId)}
                      aria-label={`Remove ${item.productName}`}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
