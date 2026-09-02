import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const STATUS_MAP = {
  draft: { label: "Draft", className: "draftbtn", key: 1 },
  pending: { label: "Pending", className: "pendingbtn", key: 2 },
  paid: { label: "Paid", className: "paidbtn", key: 3 },
  cancelled: { label: "Cancelled", className: "draftbtn", key: 1 },
  1: { label: "Draft", className: "draftbtn", key: 1 },
  2: { label: "Pending", className: "pendingbtn", key: 2 },
  3: { label: "Paid", className: "paidbtn", key: 3 },
};

export default function StatusBadge({ status, compact = false }) {
  const config = STATUS_MAP[status] || STATUS_MAP.draft;

  return (
    <button
      type="button"
      className={`btn ${config.className} ${compact ? "px-3 py-1" : "px-4"}`}
      style={compact ? { fontSize: "12px" } : undefined}
    >
      <span className="me-1">
        <FontAwesomeIcon icon={faCircle} size="2xs" />
      </span>
      <label className={config.key === 2 ? "pending" : undefined}>{config.label}</label>
    </button>
  );
}
