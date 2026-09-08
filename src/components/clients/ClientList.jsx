import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../ui/EmptyState";
import { Can } from "../../auth/guards";
import { useClients } from "../../hooks/useClients";

/**
 * Clients list — data GET /clients se aati hai (useClients hook).
 */
export default function ClientList({
  onEdit,
  onDelete,
  canEditPermission,
  canDeletePermission,
}) {
  const navigate = useNavigate();
  const { clients, isLoading } = useClients();

  if (isLoading) {
    return <p className="textcklr">Loading…</p>;
  }

  if (!clients.length) {
    return <EmptyState title="No clients yet" message="Add a client to bill invoices." />;
  }

  return (
    <div className="d-flex flex-column gap-2">
      {clients.map((client) => (
        <div
          key={client.key || client._id || client.id}
          className="row align-items-center invoice-row datalist py-3 px-2 m-0 cursor"
          onClick={() => navigate(`/clients/${client.id}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate(`/clients/${client.id}`);
          }}
        >
          <div className="col-12 col-md-3 table-text-size">{client.name}</div>
          <div className="col-12 col-md-3 textcklr small">{client.email}</div>
          <div className="col-12 col-md-2 textcklr small">
            {client.city}, {client.country}
          </div>
          <div
            className="col-12 col-md-4 d-flex gap-2 justify-content-md-end mt-2 mt-md-0 flex-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <Link to={`/clients/${client.id}`} className="btn edit py-1 px-3">
              View
            </Link>
            {canEditPermission ? (
              <Can permission={canEditPermission}>
                <button
                  type="button"
                  className="btn edit py-1 px-3"
                  onClick={() => onEdit?.(client)}
                >
                  Edit
                </button>
              </Can>
            ) : (
              <button
                type="button"
                className="btn edit py-1 px-3"
                onClick={() => onEdit?.(client)}
              >
                Edit
              </button>
            )}
            {canDeletePermission ? (
              <Can permission={canDeletePermission}>
                <button
                  type="button"
                  className="btn cancel py-1 px-3"
                  onClick={() => onDelete?.(client)}
                >
                  Delete
                </button>
              </Can>
            ) : (
              <button
                type="button"
                className="btn cancel py-1 px-3"
                onClick={() => onDelete?.(client)}
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
