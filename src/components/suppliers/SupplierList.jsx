import EmptyState from "../ui/EmptyState";
import StatusBadge from "../ui/StatusBadge";
import { Can } from "../../auth/guards";
import { useSuppliers } from "../../hooks/useSuppliers";
import { formatAmount } from "../../utils/invoice";
import { Link } from "react-router-dom";

/**
 * Suppliers list — data GET /suppliers se aati hai (useSuppliers hook).
 */
export default function SupplierList({
  onEdit,
  onDelete,
  canEditPermission,
  canDeletePermission,
}) {
  const { suppliers, isLoading } = useSuppliers();

  if (isLoading) {
    return <p className="textcklr">Loading…</p>;
  }

  if (!suppliers.length) {
    return (
      <EmptyState title="No suppliers yet" message="Add a supplier to record purchases." />
    );
  }

  return (
    <div className="d-flex flex-column gap-2">
      {suppliers.map((supplier) => (
        <div
          key={supplier.key || supplier._id || supplier.id}
          className="row align-items-center invoice-row datalist py-3 px-2 m-0"
        >
          <div className="col-12 col-md-3 table-text-size">{supplier.name}</div>
          <div className="col-12 col-md-2 textcklr small">{supplier.phone || "—"}</div>
          <div className="col-6 col-md-2 mt-2 mt-md-0">
            <StatusBadge status={supplier.status} compact />
          </div>
          <div className="col-6 col-md-2 price mt-2 mt-md-0">
            {formatAmount("Rs", supplier.currentBalance)}
          </div>
          <div className="col-12 col-md-3 d-flex gap-2 justify-content-md-end mt-2 mt-md-0 flex-wrap">
            <Link
              to={`/suppliers/${supplier.id}`}
              className="btn edit py-1 px-3"
            >
              View
            </Link>
            {canEditPermission ? (
              <Can permission={canEditPermission}>
                <button
                  type="button"
                  className="btn edit py-1 px-3"
                  onClick={() => onEdit?.(supplier)}
                >
                  Edit
                </button>
              </Can>
            ) : (
              <button
                type="button"
                className="btn edit py-1 px-3"
                onClick={() => onEdit?.(supplier)}
              >
                Edit
              </button>
            )}
            {canDeletePermission ? (
              <Can permission={canDeletePermission}>
                <button
                  type="button"
                  className="btn cancel py-1 px-3"
                  onClick={() => onDelete?.(supplier)}
                >
                  Delete
                </button>
              </Can>
            ) : (
              <button
                type="button"
                className="btn cancel py-1 px-3"
                onClick={() => onDelete?.(supplier)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
