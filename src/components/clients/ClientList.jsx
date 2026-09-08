import { Link, useNavigate } from "react-router-dom";
import { Can } from "../../auth/guards";
import { useClients } from "../../hooks/useClients";
import EmptyState from "../ui/EmptyState";

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
    <div className="flex flex-col gap-2">
      {clients.map((client) => (
        <div
          key={client.key || client._id || client.id}
          className="invoice-row datalist m-0 grid cursor grid-cols-12 items-center px-2 py-3"
          onClick={() => navigate(`/clients/${client.id}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate(`/clients/${client.id}`);
          }}
        >
          <div className="table-text-size col-span-12 md:col-span-3">{client.name}</div>
          <div className="textcklr col-span-12 text-sm md:col-span-3">{client.email}</div>
          <div className="textcklr col-span-12 text-sm md:col-span-2">
            {client.city}, {client.country}
          </div>
          <div
            className="col-span-12 mt-2 flex flex-wrap gap-2 md:col-span-4 md:mt-0 md:justify-end"
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
